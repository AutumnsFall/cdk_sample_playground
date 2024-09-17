import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import NodeCache from 'node-cache';
import logger from './logger';
import 'tsconfig-paths/register';
import cdkConfig from 'config.json';

const cache = new NodeCache({ stdTTL: 300 });
const ssmClient = new SSMClient({ region: cdkConfig.region });

export async function getParameterWithCache(paramName: string): Promise<string | undefined> {
    const cachedValue = cache.get<string>(paramName);
    if (cachedValue) {
        logger.debug(`Cache hit for parameter: ${paramName}`);
        return cachedValue;
    }

    try {
        const command = new GetParameterCommand({ Name: paramName, WithDecryption: true });
        const response = await ssmClient.send(command);

        if (response.Parameter?.Value) {
            const paramValue = response.Parameter.Value;

            cache.set(paramName, paramValue);
            logger.info(`Fetched and cached parameter: ${paramName}`);

            return paramValue;
        }
    } catch (error) {
        logger.error(`Error fetching parameter: ${paramName}`, { error });
    }

    return undefined;
}
