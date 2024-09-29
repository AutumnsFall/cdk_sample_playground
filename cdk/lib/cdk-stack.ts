import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';
import { ApiGateway } from './api-gateway';
import { S3Bucket } from './s3-bucket';
import { CloudfrontDistribution } from './cloudfront-distribution';
import { getSSLCertificate } from './ssl-certificate';
import 'tsconfig-paths/register';
import config from 'config.json';
import { Ec2VPC } from './ec2_vpc';
import { Ec2Alb } from './ec2_alb';
import { Ec2AutoScalingGroup } from './ec2-autoScaling';
import { InstanceClass, InstanceSize, InstanceType, MachineImage, SubnetType } from 'aws-cdk-lib/aws-ec2';

export class CdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, {
            ...props,
        });

        const originAccessIdentity = CloudfrontDistribution.getOAI(this);
        const certificate = getSSLCertificate(this);

        let restApiGateway: ApiGateway | undefined;
        let lambdaStack: LambdaStack | undefined;
        let alb: Ec2Alb | undefined;

        if (config.enableAPILambda) {
            lambdaStack = new LambdaStack(this, 'LambdaStack');
            restApiGateway = new ApiGateway(this, 'ApiGatewayStack', lambdaStack.functions);

            new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: restApiGateway.url });
        }

        const bucket = new S3Bucket(this, 'S3Bucket', originAccessIdentity);
        bucket.grantRead(originAccessIdentity);

        if (config.enableEc2) {
            const vpc = new Ec2VPC(this, 'VPC');
            alb = new Ec2Alb(this, 'ALB', {
                vpc,
                cloudFrontOnly: false,
                certificateArn: certificate.certificateArn,
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

        const distribution = new CloudfrontDistribution(this, 'CloudfrontDistribution', {
            certificate,
            originAccessIdentity,
            bucket,
            lambdaApiOrigin: restApiGateway ? restApiGateway.url : '',
            albDnsName: alb ? alb.loadBalancerDnsName : '',
        });

        bucket.deployBucket(distribution);

        new cdk.CfnOutput(this, 'CloudFrontDomain', {
            value: distribution.domainName,
        });
    }
}
