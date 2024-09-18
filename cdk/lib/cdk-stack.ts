import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';
import { ApiGateway } from './api-gateway';
import { S3Bucket } from './s3-bucket';
import { CloudfrontDistribution } from './cloudfront-distribution';
import { getSSLCertificate } from './ssl-certificate';
import 'tsconfig-paths/register';
import config from 'config.json';

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, {
            ...props,
        });

        const originAccessIdentity = CloudfrontDistribution.getOAI(this);
        const certificate = getSSLCertificate(this);

        let restApiGateway: ApiGateway | undefined;
        let lambdaStack: LambdaStack | undefined;

        if (config.enableAPILambda) {
            lambdaStack = new LambdaStack(this, 'LambdaStack');
            restApiGateway = new ApiGateway(this, 'ApiGatewayStack', lambdaStack.functions);
        }

        const bucket = new S3Bucket(this, 'S3Bucket', originAccessIdentity);
        bucket.grantRead(originAccessIdentity);

        const distribution = new CloudfrontDistribution(this, 'CloudfrontDistribution', {
            certificate,
            originAccessIdentity,
            bucket,
            lambdaApiOrigin: restApiGateway ? restApiGateway.url : '',
        });

        bucket.deployBucket(distribution);

        new cdk.CfnOutput(this, 'CloudFrontDomain', {
            value: distribution.domainName,
        });
    }
}
