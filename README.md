# Acceptance tests for hyperledger fabric deployment
This repo consists of acceptance tests that verify the deployment of new hyperledger fabric based permissioned blockchain. To run these tests do following:
1. Clone this repo
	```
	git clone git@github.com:predix/fabric-acceptance-tests.git
	```
1. Edit the file `specs/config/config.js` to specify the correct parameters to run these tests. Most of the parameters specified in the file will work out-of-box for bosh-lite deployment of [fabric-release](https://github.com/predix/fabric-release) using its `manifests/fabric.yml` deployment manifest. But if you have changed the deployment manifest or customized it then change the `specs/config/config.js` file accordingly.
1. Execute following commands
	```
	npm install
	npm test
	```