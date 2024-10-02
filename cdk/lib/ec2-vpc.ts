import { Vpc, VpcProps } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class Ec2VPC extends Vpc {
    constructor(scope: Construct, id: string, props?: VpcProps) {
        super(scope, id, {
            maxAzs: 2,
            natGateways: 1,
            ...props,
        });
    }
}
