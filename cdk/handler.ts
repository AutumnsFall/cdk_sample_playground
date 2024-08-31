import logger from './src/helpers/logger';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import resHelper from './src//helpers/responses';

export const helloHandler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
    try {
        await Promise.resolve();
        logger.info('Hello from Lambda!');
        return resHelper.getSuccessResponse(JSON.stringify({ msg: 'Hello from Lambda!' }), resHelper.getOrigin(event));
    } catch (error) {
        logger.error('HelloHandler Error.', { error });
        return resHelper.getErrorResponse(error as Error, resHelper.getOrigin(event));
    }
};
