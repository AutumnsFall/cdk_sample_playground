import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import 'tsconfig-paths/register';
import config from 'config.json';
import { Ec2VPC } from './ec2-vpc';
import { Ec2Alb } from './ec2-alb';
import { Ec2AutoScalingGroup } from './ec2-asg';
import { InstanceClass, InstanceSize, InstanceType, MachineImage, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { LambdaApiStack } from './lambda_api-stack';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { getSSLCertificate } from './ssl_certificate';
import { MainSiteBucket } from './main_site-bucket';

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, {
            ...props,
        });

        this.setupMainSite();

        if (config.enableEc2) {
            const vpc = new Ec2VPC(this, 'VPC');
            const alb = new Ec2Alb(this, 'ALB', {
                vpc,
                cloudFrontOnly: false,
            });

            const ec2InstanceSecurityGroup = Ec2AutoScalingGroup.addAlbIngressRule(
                Ec2AutoScalingGroup.getSecurityGroup(this, vpc),
                alb.securityGroup,
            );

            const ec2UserData = Ec2AutoScalingGroup.getEc2UserData();
            const ec2Role = Ec2AutoScalingGroup.getEc2Role(this);

            const asg = new Ec2AutoScalingGroup(this, 'ASG', {
                vpc,
                instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
                machineImage: MachineImage.latestAmazonLinux2(),
                vpcSubnets: { subnetType: SubnetType.PUBLIC },
                securityGroup: ec2InstanceSecurityGroup,
                role: ec2Role,
                userData: ec2UserData,
            });

            alb.httpsListener.addTargets('Ec2InstanceTargetGroup', {
                port: 80,
                targets: [asg],
                healthCheck: {
                    path: '/',
                    interval: cdk.Duration.minutes(1),
                    timeout: cdk.Duration.seconds(30),
                    healthyHttpCodes: '200',
                },
            });

            new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: alb.loadBalancerDnsName });
        }
    }

    private setupMainSite() {
        // Deploy the main website
        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'originAccessIdentity', {
            comment: 'Access to S3 bucket only via CloudFront',
        });
        const certificate = getSSLCertificate(this, config.ssm.mainCertificateArnPath);

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
