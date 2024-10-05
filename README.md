
# Project Title
This is a simple playground CDK project I worked on to test/try some things. 

## License
[MIT](https://choosealicense.com/licenses/mit/)


## Authors
- [@AutumnsFall](https://github.com/AutumnsFall)


## Installation
Install node_modules (use npm, yarn or whatever you like)
Depending on the manager you used, please make sure the packages required for parent folder and it's child folders are installed correctly.


### A note on AWS side setup
The project it set up in a way to use domain name and manually configured route 53 and SSL certs. Therefore, prerequisites are required should you plan to run on your AWS account.

1. Get yourself a domain.
2. Re-route the nameservers from the service you bought from to AWS via Route 53
3. Once domain is hosted in Route 53, apply for Global SSL cert for CloudFront in us-east-1 
4. Get the Local(your Deployment Zone) SSL cert for the load balancer(s).
5. Update your account's ParameterStore with the new parameter routes and keys.
6. Deploy the app via 
```bash 
  npm run deploy:dev-all
```
7. Configure Route 53 to Alias the CloudFront distributions and Load Balancer(s) with the resources.

And you are set.

#### 

    
## Deployment

To deploy this project run

```bash
  npm run deploy:dev-all
```

