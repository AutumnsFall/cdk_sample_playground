import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const lambdaStack = new LambdaStack(this, 'LambdaStack');
        const lambdaFunctions = lambdaStack.functions;

        new ApiGatewayStack(this, 'ApiGatewayStack', lambdaFunctions);
    }
}
