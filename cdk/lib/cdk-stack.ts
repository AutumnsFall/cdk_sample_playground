import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new LambdaStack(this, 'LambdaStack');
  }
}
