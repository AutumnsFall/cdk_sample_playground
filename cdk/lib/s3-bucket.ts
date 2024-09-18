import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront';

export class S3Bucket extends s3.Bucket {
    constructor(
        private scope: Construct,
        id: string,
        private originAccessIdentity: cdk.aws_cloudfront.OriginAccessIdentity,
        props?: s3.BucketProps,
    ) {
        //// https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-cloudfront-origins.S3Origin.html
        const defaultProps: s3.BucketProps = {
            bucketName: `sample.thantzin.ovh`,
            versioned: true,
            enforceSSL: true,
            publicReadAccess: false,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: Change to RETAIN in production
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            accessControl: s3.BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
        };

        super(scope, id, { ...defaultProps, ...props });

        this.setupPolicy();
    }

    private setupPolicy(): void {
        this.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ['s3:GetObject'],
                resources: [this.arnForObjects('*')],
                principals: [
                    new iam.CanonicalUserPrincipal(
                        this.originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId,
                    ),
                ],
            }),
        );
    }

    public deployBucket(cfDistribution: IDistribution): void {
        new s3deploy.BucketDeployment(this.scope, 'deployWebsite', {
            sources: [s3deploy.Source.asset(path.resolve(__dirname, '../../spa/public'))],
            destinationBucket: this,
            distribution: cfDistribution,
            distributionPaths: ['/*'],
        });
    }
}
