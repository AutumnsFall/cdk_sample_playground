import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';
import { ApiGateway } from './api-gateway';
import { S3Bucket } from './s3-bucket';
// import { getSSLCertificate } from './ssl-certificate';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import 'tsconfig-paths/register';
import config from 'config.json';

export class LambdaApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const domainName = config.domainNames.main;

        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'originAccessIdentity', {
            comment: 'Access to S3 bucket only via CloudFront',
        });
        // const certificate = getSSLCertificate(this, config.ssm.mainCertificateArnPath);

        let restApiGateway: ApiGateway | undefined;
        let lambdaStack: LambdaStack | undefined;

        lambdaStack = new LambdaStack(this, 'LambdaStack');
        restApiGateway = new ApiGateway(this, 'ApiGatewayStack', lambdaStack.functions);

        new cdk.CfnOutput(this, 'LambdaApiGateway:', { value: restApiGateway.url });

        const bucket = new S3Bucket(this, 'S3Bucket', originAccessIdentity);
        bucket.grantRead(originAccessIdentity);

        const distribution = new cloudfront.Distribution(this, 'Distribution', {
            defaultRootObject: 'index.html',
            defaultBehavior: {
                origin: new origins.S3Origin(bucket, {
                    originId: 's3-origin',
                    originAccessIdentity: originAccessIdentity,
                }),
                cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            additionalBehaviors: {
                [`/${config.stage}/*`]: {
                    origin: new origins.HttpOrigin(restApiGateway.url.replace(/(http(s)?:\/\/)|(\/.*)/g, ''), {
                        originId: 'api-gateway-origin',
                        originPath: '',
                    }),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                },
            },
            // certificate,
            domainNames: [`${domainName}`],
            enableLogging: false,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        });

        bucket.deployBucket(distribution);

        new cdk.CfnOutput(this, 'CloudFrontDomain', {
            value: distribution.domainName,
        });
    }
}
