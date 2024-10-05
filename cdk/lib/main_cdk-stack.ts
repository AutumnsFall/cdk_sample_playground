import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import 'tsconfig-paths/register';
import config from 'config.json';
import { LambdaApiStack } from './lambda_api-stack';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { getSSLCertificate } from './ssl_certificate';
import { MainSiteBucket } from './main_site-bucket';
import { Ec2Stack } from './ec2-stack';

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, {
            ...props,
        });

        this.setupMainSite();

        new Ec2Stack(this, 'Ec2Stack');
    }

    private setupMainSite() {
        // Deploy the main website
        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'originAccessIdentity', {
            comment: 'Access to Main Site S3 bucket only via CloudFront',
        });
        const certificate = getSSLCertificate(this, config.ssm.mainSite.globalCertificateArnPath);

        const bucket = new MainSiteBucket(this, 'S3MainSiteBucket', originAccessIdentity);
        bucket.grantRead(originAccessIdentity);

        const domainName = config.domainNames.main;
        let additionalBehaviors: Record<string, cloudfront.BehaviorOptions> = {};
        // setup API Gateway
        if (config.enableAPILambda) {
            const lambdaStack = new LambdaApiStack(this, 'LambdaApiStack');
            const apiGatewayUrl = lambdaStack.gatewayUrl;
            additionalBehaviors[`/${config.stage}/*`] = {
                origin: new origins.HttpOrigin(apiGatewayUrl.replace(/(http(s)?:\/\/)|(\/.*)/g, ''), {
                    originId: 'api-gateway-origin',
                    originPath: '',
                }),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            };
        }

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
            additionalBehaviors,
            certificate,
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
