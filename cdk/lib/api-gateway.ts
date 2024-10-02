import { LambdaIntegration, MethodLoggingLevel, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { LambdaFunctions } from './lambda_functions-stack';
import 'tsconfig-paths/register';
import config from 'config.json';

export interface ApiGatewayProps extends LambdaFunctions {}

export class ApiGateway {
    private api: RestApi;

    public constructor(
        mainscope: Construct,
        id: string,
        private props: ApiGatewayProps,
    ) {
        this.api = new RestApi(mainscope, id, {
            restApiName: `cdk-${config.stage}-app`,
            description: 'API behind CloudFront',
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
        this.api.root.addResource('hello').addMethod(
            'get',
            new LambdaIntegration(this.props.helloLambdaFn, {
                proxy: true,
            }),
        );
    }

    public get url(): string {
        return this.api.url;
    }
}
