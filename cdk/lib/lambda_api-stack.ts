import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaFunctionsStack } from './lambda_functions-stack';
import { ApiGateway } from './api-gateway';

export class LambdaApiStack extends cdk.Stack {
    private readonly _gatewayUrl: string;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const lambdaStack = new LambdaFunctionsStack(this, 'LambdaStack');
        const restApiGateway = new ApiGateway(this, 'ApiGatewayStack', lambdaStack.functions);

        this._gatewayUrl = restApiGateway.url;

        new cdk.CfnOutput(this, 'LambdaApiGateway:', { value: restApiGateway.url });
    }

    public get gatewayUrl(): string {
        return this._gatewayUrl;
    }
}
