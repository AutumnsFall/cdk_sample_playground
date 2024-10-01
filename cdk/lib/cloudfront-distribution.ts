/*
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import 'tsconfig-paths/register';
import config from 'config.json';

export enum CfType {
    S3 = 'S3',
    EC2 = 'EC2',
    ECS = 'ECS',
}

export interface CFPayload {
    certificate: ICertificate;
    defaultBehavior?: cloudfront.BehaviorOptions;
    additionalBehaviors?: Record<string, cloudfront.BehaviorOptions>;
    originAccessIdentity?: cloudfront.OriginAccessIdentity;
    bucket?: Bucket;
    origin?: string;
    cfType: CfType;
}

export class CloudfrontDistribution extends cloudfront.Distribution {
    constructor(scope: Construct, id: string, payload: CFPayload, props?: cloudfront.DistributionProps) {
        const { certificate, originAccessIdentity, bucket } = payload;
        const defaultBehavior =
            // {
            //     origin: new origins.HttpOrigin(albDnsName!.replace(/(http(s)?:\/\/)|(\/.*)/g, ''), {
            //         protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            //         originId: 'alb-origin',
            //         originPath: '',
            //     }),
            //     allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            //     viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            // };

            {
                origin: new origins.S3Origin(bucket, {
                    originId: 's3-origin',
                    originAccessIdentity: originAccessIdentity,
                }),
                cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            } as cloudfront.BehaviorOptions;

        const additionalBehaviors: Record<string, cloudfront.BehaviorOptions> = {};
        if (config.enableAPILambda) {
            additionalBehaviors[`/${config.stage}/*`] = {
                origin: new origins.HttpOrigin(lambdaApiOrigin!.replace(/(http(s)?:\/\/)|(\/.*)/g, ''), {
                    originId: 'api-gateway-origin',
                    originPath: '',
                }),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            };
        }

        if (config.enableEc2) {
            additionalBehaviors[`/ec2/${config.stage}/*`] = {
                origin: new origins.HttpOrigin(albDnsName!.replace(/(http(s)?:\/\/)|(\/.*)/g, ''), {
                    protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                    originId: 'alb-origin',
                    originPath: '',
                }),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            };
        }

        super(scope, id, {
            defaultRootObject: 'index.html',
            defaultBehavior,
            additionalBehaviors,
            certificate,
            domainNames: [`${config.domainName}`],
            enableLogging: false,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            ...props,
        });
    }

    public static getOAI(construct: Construct): cloudfront.OriginAccessIdentity {
        return new cloudfront.OriginAccessIdentity(construct, 'originAccessIdentity', {
            comment: 'Access to S3 bucket only via CloudFront',
        });
    }
}
*/
