'use strict';

var expect = require('chai').expect;
var hyperledgerUtil = require('hfc-util');
var eventually = require('./testUtils/eventually');
var config = require('./config/config');
var Promise = require('bluebird');
var mocha = require('mocha');
var coMocha = require('co-mocha');
var randomstring = require('randomstring');
var delay = require('delay');

coMocha(mocha)

describe('Blockchain', function () {
    var chaincodeID;
    var newuser;

    before(function* () {
        expect(config.ca).to.not.be.undefined;
        expect(config.ca).to.not.be.empty;
        expect(config.peers).to.not.be.undefined;
        expect(config.peers).to.not.be.empty;
        hyperledgerUtil.setupChain(config.blockchainName, config.ca, config.peers, config.keyValueLocation, config.vaultUrl, config.vaultToken);
    })

    it('should be able to enroll registrar', function* () {
        console.log("Starting enrolling user");
        try {
            yield hyperledgerUtil.enrollRegistrar(config.registrarUserName, config.registrarPassword);
            console.log("Done enrolling registrar");
            var registrar = hyperledgerUtil.getRegistrar();
            expect(registrar.getName()).to.equal(config.registrarUserName);
        } catch (err) {
            expect.fail(err, null, err.message);
        }
    })

    it('should be able to enroll a regular user', function* () {
        console.log("Starting enrolling user");
        try {
            yield hyperledgerUtil.enrollUser(config.userName, config.password);
            newuser = config.userName;
        } catch (err) {
            expect.fail(err, null, err.message);
        }
    })

    if (config.useNewUser) {
        it('should register and enroll a new user', function* () {
            console.log("Starting registering new user");
            try {
                newuser = randomstring.generate({
                    length: 8,
                    charset: 'alphabetic'
                });
                console.log("Registering new user", newuser);
                var enrollmentSecret = yield hyperledgerUtil.registerUser(newuser, config.newUserAffiliation);
                console.log("Enrollment secret for", newuser, "is", enrollmentSecret);
                yield hyperledgerUtil.enrollUser(newuser, enrollmentSecret);
                console.log("Successfully registered and enrolled a new user", newuser);
            } catch (err) {
                expect.fail(err, null, err.message);
            }
        })
    }

    function* waitForDeployTransaction(tx) {
        var eventReceived = false;
        var errorMessage = null;
        tx.on('complete', function (results) {
            // Deploy request completed successfully
            console.log("deploy results", results);
            eventReceived = true;
            // Set the testChaincodeID for subsequent tests
            chaincodeID = results.chaincodeID;
            console.log("Successfully deployed chaincode", chaincodeID);
            expect(chaincodeID).to.not.be.empty;
        });
        tx.on('error', function (err) {
            console.log("Failed to deploy chaincode", err);
            errorMessage = err.message;
            // expect.fail(err, null, err.message);
            eventReceived = true;
        });
        yield eventually(function* () {
            return eventReceived;
        }, 1000, 50000).should.equal(true);
        expect(chaincodeID).to.not.be.empty;
        expect(errorMessage).to.be.null;
    }

    function* invokeChaincodeAndVerify(fnName, args, invokeResult) {
        console.log("Starting invoking chaincode");
        try {
            var user = yield hyperledgerUtil.getUser(newuser);
            var tx = yield hyperledgerUtil.invokeChaincode(user, fnName, args, chaincodeID);
            yield waitForInvokeTransaction(tx, invokeResult);
        } catch (err) {
            expect.fail(err, null, err.message);
        }
    }

    it('should be able to deploy chaincode', function* () {
        if (!config.skipDeploy) {
            this.timeout(60000);
            console.log("Starting deploying chaincode");
            try {
                var chaincodePath = config.chaincodePath;
                var args = config.chaincodeInitArgs;
                var user = yield hyperledgerUtil.getUser(newuser);
                var tx = yield hyperledgerUtil.deployChaincode(user, args, chaincodePath);
                yield waitForDeployTransaction(tx);
            } catch (err) {
                expect.fail(err, null, err.message);
            }
        } else {
            this.timeout(15000);
            chaincodeID = config.chaincodeID;
            console.log("Skipping chaincode deploy, just initializing already deployed chaincode");
            yield invokeChaincodeAndVerify("set", config.chaincodeSetArgs, config.chaincodeQueryResult);
        }
    })

    function* waitForQueryTransaction(tx) {
        var eventReceived = false;
        var bal = null;
        var errMessage = null;
        tx.on('complete', function (results) {
            bal = results.result.toString();
            console.log("query results", bal);
            eventReceived = true;
        });
        tx.on('error', function (err) {
            console.log("Failed to query chaincode", err)
            eventReceived = true;
            errMessage = err.message;
        });
        yield eventually(function* () {
            return eventReceived;
        }, 1000, 4000).should.equal(true)
        expect(errMessage).to.be.null;
        return bal;
    }

    function* waitForQueryTransactionAndVerify(tx, queryResult) {
        var bal = yield waitForQueryTransaction(tx);
        expect(bal).to.be.equal(queryResult)
    }

    function* queryChaincode() {
        var args = config.chaincodeQueryArgs;
        var user = yield hyperledgerUtil.getUser(newuser);
        var tx = yield hyperledgerUtil.queryChaincode(user, args, chaincodeID);
        return tx;
    }

    it('should be able to query chaincode', function* () {
        this.timeout(5000);
        console.log("Starting querying chaincode");
        try {
            var tx = yield queryChaincode();
            yield waitForQueryTransactionAndVerify(tx, config.chaincodeQueryResult);
        } catch (err) {
            expect.fail(err, null, err.message);
        }
    })

    function* waitForInvokeTransaction(tx, invokeResult) {
        var eventReceived = false;
        var bal = null;
        var errMessage = null;
        tx.on('submitted', function (results) {
            console.log("invoke results", results);
            eventReceived = true;
        });
        tx.on('error', function (err) {
            console.log("Failed to invoke chaincode", err)
            eventReceived = true;
        });
        yield eventually(function* () {
            return eventReceived;
        }, 1000, 5000).should.equal(true);
        expect(errMessage).to.be.null;
        yield eventually(function* () {
            var tx = yield queryChaincode();
            var bal = yield waitForQueryTransaction(tx);
            return bal;
        }, 1000, 5000).should.equal(invokeResult);
    }

    it('should be able to invoke chaincode', function* () {
        this.timeout(15000);
        console.log("Starting invoking chaincode");
        try {
            var args = config.chaincodeInvokeArgs;
            yield invokeChaincodeAndVerify("invoke", config.chaincodeInvokeArgs, config.chaincodeInvokeResult);
        } catch (err) {
            expect.fail(err, null, err.message);
        }
    })

});