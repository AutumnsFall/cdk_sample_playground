import * as cdk from 'aws-cdk-lib';
import { Ec2VPC } from './ec2-vpc';
import { Ec2Alb } from './ec2-alb';
import { Ec2AutoScalingGroup } from './ec2-asg';
import { InstanceClass, InstanceSize, InstanceType, MachineImage, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import 'tsconfig-paths/register';
import config from 'config.json';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { getSSLCertificate } from './ssl_certificate';

export class Ec2Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, {
            ...props,
        });

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

            alb.addHttpsTargets(asg);

            const domainName = config.domainNames.ec2;

            let additionalBehaviors: Record<string, cloudfront.BehaviorOptions> = {};
            const certificate = getSSLCertificate(this, config.ssm.ec2.globalCertificateArnPath);

            const distribution = new cloudfront.Distribution(this, 'Distribution', {
                defaultRootObject: 'index.html',
                defaultBehavior: {
                    origin: new origins.HttpOrigin(alb.loadBalancerDnsName.replace(/(http(s)?:\/\/)|(\/.*)/g, ''), {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                        originId: 'alb-origin',
                        originPath: '',
                    }),
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                },
                additionalBehaviors,
                certificate,
                domainNames: [`${domainName}`],
                enableLogging: false,
                minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            });

            new cdk.CfnOutput(this, 'CloudFrontDomain', {
                value: distribution.domainName,
            });

            new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: alb.loadBalancerDnsName });
        }
    }
}
