import {
    ApplicationLoadBalancer,
    ApplicationLoadBalancerProps,
    SslPolicy,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import 'tsconfig-paths/register';
import config from 'config.json';
import { getSSLCertificate } from './ssl_certificate';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Ec2AutoScalingGroup } from './ec2-asg';

export interface Ec2AlbProps extends ApplicationLoadBalancerProps {
    vpc: ec2.IVpc;
    cloudFrontOnly: boolean;
    certificateArn?: string;
}

export interface Ec2AlbInstanceVars {}

export class Ec2Alb extends ApplicationLoadBalancer {
    private sg: ec2.ISecurityGroup;

    constructor(
        scope: Construct,
        id: string,
        private props: Ec2AlbProps,
    ) {
        super(scope, id, {
            vpc: props.vpc,
            internetFacing: true,
        });

        this.createSecurityGroup();
        if (this.props.cloudFrontOnly) {
            this.allowCloudFrontOnlyInbound();
        } else {
            this.allowHTTPSInbound();
        }
        this.addSecurityGroup(this.sg);
        this.addListeners();
    }

    private createSecurityGroup() {
        this.sg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
            vpc: this.props.vpc,
            allowAllOutbound: true,
            description: 'Allow HTTP/HTTPS traffic',
        });
    }

    private allowCloudFrontOnlyInbound() {
        const cloudfrontCidrIps = [
            '13.32.0.0/15',
            '52.46.0.0/18',
            '52.84.0.0/15',
            '52.222.128.0/17',
            '54.182.0.0/16',
            '54.192.0.0/16',
            '54.230.0.0/16',
            '54.239.128.0/18',
            '54.239.192.0/19',
            '70.132.0.0/18',
            '143.204.0.0/16',
            '204.246.164.0/22',
            '204.246.168.0/22',
            '204.246.174.0/23',
            '204.246.176.0/20',
            '205.251.192.0/19',
            '205.251.249.0/24',
            '205.251.250.0/23',
            '205.251.252.0/23',
            '205.251.254.0/24',
            '216.137.32.0/19',
        ];
        cloudfrontCidrIps.forEach((cidrIp) => {
            this.sg.addIngressRule(ec2.Peer.ipv4(cidrIp), ec2.Port.tcp(443), 'Allow traffic from CloudFront Only');
        });
    }

    private allowHTTPSInbound() {
        this.sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow traffic from anywhere');
    }

    private addListeners() {
        this.addListener('HttpsListener', {
            port: 443,
            open: true,
            certificates: [
                certificatemanager.Certificate.fromCertificateArn(
                    this,
                    'ALBCert',
                    getSSLCertificate(this, config.ssm.ec2.localCertificateArnPath).certificateArn,
                ),
            ],
            sslPolicy: SslPolicy.RECOMMENDED,
        });
    }

    get httpsListener() {
        return this.listeners[0];
    }

    get securityGroup(): ec2.ISecurityGroup {
        return this.sg;
    }

    public addHttpsTargets(targets: Ec2AutoScalingGroup) {
        this.listeners[0].addTargets('HttpsEc2Targets', {
            port: 80,
            targets: [targets],
        });
    }
}
