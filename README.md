# Project Description
This repository contains a simple CDK playground project developed to experiment with and test various AWS configurations and features.

## License
This project is licensed under the [MIT](https://choosealicense.com/licenses/mit/) License.

## Author
[@AutumnsFall](https://github.com/AutumnsFall)

## Installation
To install the necessary dependencies, ensure that you have an appropriate package manager installed (e.g., npm, yarn). Depending on the manager used, confirm that all required packages are correctly installed in both the parent folder and its child directories.

## AWS Setup Prerequisites
This project is designed to work with a custom domain and utilizes AWS Route 53 and SSL certificates, which require manual configuration. Before deploying to your AWS environment, ensure that the following prerequisites are met:

1. Obtain a domain name from a domain registrar of your choice.
2. Configure the domain’s nameservers to point to AWS by setting them up in Route 53.
3. Request a global SSL certificate for CloudFront in the us-east-1 region.
4. Request a local SSL certificate for your load balancer(s) in your deployment region.
5. Update the AWS Systems Manager Parameter Store with the required parameters, including route configurations and keys.
6. Deploy the application by running:
```bash
npm run deploy:dev-all
```
7. Update Route 53 to create alias records pointing to the CloudFront distributions and load balancer(s) associated with your resources.
Once these steps are completed, the project will be ready to deploy and use.

#### Accessing EC2 Instances
There is no Bastion Host configured for direct SSH access to the EC2 instances. However, the instances are equipped with AWS Systems Manager (SSM) Managed Instance Core, enabling access via the SSM Session Manager.

### Deployment
To deploy the project, use the following command:

```bash
npm run deploy:dev-all
```
