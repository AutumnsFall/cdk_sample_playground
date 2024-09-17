import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';
import { ApiGateway } from './api-gateway';
import { S3Bucket } from './s3-bucket';
import { CloudfrontDistribution } from './cloudfront-distribution';
import { getSSLCertificate } from './ssl-certificate';

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, {
            ...props,
        });

        const lambdaStack = new LambdaStack(this, 'LambdaStack');
        const lambdaFunctions = lambdaStack.functions;

        const originAccessIdentity = CloudfrontDistribution.getOAI(this);
        const certificate = getSSLCertificate(this);

        const restApiGateway = new ApiGateway(this, 'ApiGatewayStack', lambdaFunctions);

        const bucket = new S3Bucket(this, 'S3Bucket', originAccessIdentity);
        bucket.grantRead(originAccessIdentity);

        const distribution = new CloudfrontDistribution(this, 'CloudfrontDistribution', {
            certificate,
            originAccessIdentity,
            bucket,
            httpOrigin: restApiGateway.url,
        });

        bucket.deployBucket(distribution);

        new cdk.CfnOutput(this, 'CloudFrontDomain', {
            value: distribution.domainName,
        });
    }
}
