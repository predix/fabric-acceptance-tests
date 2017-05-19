# Acceptance tests for hyperledger fabric deployment
This repo consists of acceptance tests that verify the deployment of new hyperledger fabric based permissioned blockchain. To run these tests do following:
1. Clone this repo
	```
	mkdir -p $HOME/workspace
	cd $HOME/workspace
	git clone git@github.com:predix/fabric-acceptance-tests.git
	```
1. Edit the file `specs/config/config.js` to specify the correct parameters to run these tests. Most of the parameters specified in the file will work out-of-box for bosh-lite deployment of [fabric-release](https://github.com/predix/fabric-release) using its `manifests/fabric.yml` deployment manifest. But if you have changed the deployment manifest or customized it then change the `specs/config/config.js` file accordingly.
1. Set the `GOPATH`
	```
	export GOPATH=$HOME/go
	```
1. Run following command to get the chaincode that will be deployed by this acceptance test
	```
	go get github.com/predix/chaincode_example
	```
	or
	```
	cd $GOPATH/src
	mkdir -p github.com/predix
	git clone https://github.com/predix/chaincode_example
	```
1. Git clone hyperledger fabric v0.6.1
	```
	cd $GOPATH/src
	mkdir -p github.com/hyperledger
	cd github.com/hyperledger
	git clone https://github.com/hyperledger/fabric
	git checkout tags/v0.6.1-preview
	```
1. Vendor-in fabric v0.6.1 for chaincodes that will be deployed
	```
	cd $GOPATH/src/github.com/predix/chaincode_example/chaincode_example01
	mkdir -p vendor/github.com/hyperledger/fabric
	cd vendor/github.com/hyperledger/fabric
	cp -r $GOPATH/src/github.com/hyperledger/fabric .

	cd $GOPATH/src/github.com/predix/chaincode_example/authorizable_counter
	mkdir -p vendor/github.com/hyperledger/fabric
	cd vendor/github.com/hyperledger/fabric
	cp -r $GOPATH/src/github.com/hyperledger/fabric .
	```
1. Execute following commands
	```
	cd $HOME/workspace/fabric-acceptance-tests
	npm install
	npm test
	```