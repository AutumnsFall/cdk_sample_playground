import { LambdaIntegration, MethodLoggingLevel, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { LambdaStackFunctions } from './lambda-stack';
import config from '../config/cdk.json';

export interface ApiGatewayProps extends LambdaStackFunctions {}

export class ApiGatewayStack extends RestApi {
    public constructor(
        mainscope: Construct,
        id: string,
        private props: ApiGatewayProps,
    ) {
        super(mainscope, id, {
            restApiName: `cdk-${config.stage}-app`,
            description: 'This service is the API Gateway',
            deployOptions: {
                stageName: config.stage,
                loggingLevel: MethodLoggingLevel.INFO,
                dataTraceEnabled: true,
                metricsEnabled: true,
                tracingEnabled: true,
            },
            cloudWatchRole: true,
            defaultCorsPreflightOptions: {
                allowHeaders: ['Content-Type', 'X-Amz-Date'],
                allowOrigins: [...config.allowedOrigins],
                allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'DELETE'],
            },
        });

        this.setupResources();
    }

    private setupResources() {
        this.setupHelloApi();
    }

    private setupHelloApi() {
        this.root.addResource('hello').addMethod(
            'get',
            new LambdaIntegration(this.props.helloLambdaFn, {
                proxy: true,
            }),
        );
    }
}
