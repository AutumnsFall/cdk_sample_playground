import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import 'tsconfig-paths/register';
import config from 'config.json';

export const getSSLCertificate = (construct: Construct): certificatemanager.ICertificate => {
    const certificateArn = ssm.StringParameter.valueForStringParameter(construct, config.ssm.certificateArnPath);
    const certificate = certificatemanager.Certificate.fromCertificateArn(construct, 'Certificate', certificateArn);
    return certificate;
};
