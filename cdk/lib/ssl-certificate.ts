import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export const getSSLCertificate = (construct: Construct, path: string): certificatemanager.ICertificate => {
    const certificateArn = ssm.StringParameter.valueForStringParameter(construct, path);
    const certificate = certificatemanager.Certificate.fromCertificateArn(construct, 'Certificate', certificateArn);
    return certificate;
};
