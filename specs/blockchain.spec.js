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
    function* waitForDeployTransaction(tx) {
        var eventReceived = false;
        var errorMessage = null;
        var chaincodeID;
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
            eventReceived = true;
        });
        yield eventually(function* () {
            return eventReceived;
        }, 1000, 50000).should.equal(true);
        expect(chaincodeID).to.not.be.empty;
        expect(errorMessage).to.be.null;
        return chaincodeID;
    }

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
        var bal = yield* waitForQueryTransaction(tx);
        expect(bal).to.be.equal(queryResult)
    }

    function* queryChaincode(newuser, chaincodeID, fn, args, attrs=null) {
        var user = yield hyperledgerUtil.getUser(newuser);
        var tx = yield hyperledgerUtil.queryChaincode(user, fn, args, chaincodeID, attrs);
        return tx;
    }

    function* waitForInvokeTransaction(tx, newuser, chaincodeID, chaincode, useQueryResult) {
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
        var result = useQueryResult ? chaincode.chaincodeQueryResult : chaincode.chaincodeInvokeResult;
        yield eventually(function* () {
            var tx = yield* queryChaincode(newuser, chaincodeID, chaincode.chaincodeQueryFn,
                chaincode.chaincodeQueryArgs);
            var bal = yield* waitForQueryTransaction(tx);
            return bal;
        }, 1000, 5000).should.equal(result);
    }

    function* invokeChaincodeAndVerify(newuser, chaincodeID, chaincode, useSetFn = false,
        useQueryResult = false, attrs=null) {
        console.log("Starting invoking chaincode");
        try {
            var user = yield hyperledgerUtil.getUser(newuser);
            var fn = useSetFn ? chaincode.chaincodeSetFn : chaincode.chaincodeInvokeFn;
            var args = useSetFn ? chaincode.chaincodeSetArgs : chaincode.chaincodeInvokeArgs;
            var tx = yield hyperledgerUtil.invokeChaincode(user, fn, args, chaincodeID, attrs);
            yield* waitForInvokeTransaction(tx, newuser, chaincodeID, chaincode, useQueryResult);
            console.log("Successfully invoked and verified chaincode");
        } catch (err) {
            expect.fail(err, null, err.message);
        }
    }

    function* registerAndEnrollUser(userAffiliation, isRegistrar = false, attrs) {
        var usr = randomstring.generate({
            length: 8,
            charset: 'alphabetic'
        });
        console.log("Registering new user", usr);
        var enrollmentSecret = yield hyperledgerUtil.registerUser(usr, userAffiliation, isRegistrar, attrs);
        console.log("Enrollment secret for", usr, "is", enrollmentSecret);
        yield hyperledgerUtil.enrollUser(usr, enrollmentSecret);
        console.log("Successfully registered and enrolled a new user", usr, "with attribute ", attrs);
        return usr;
    }

    before(function* () {
        expect(config.ca).to.not.be.undefined;
        expect(config.ca).to.not.be.empty;
        expect(config.peers).to.not.be.undefined;
        expect(config.peers).to.not.be.empty;
        hyperledgerUtil.setupChain(config.blockchainName, config.ca, config.peers, config.keyValueLocation, config.vaultUrl, config.vaultToken);
    })

    describe('Regular chaincode', function () {
        var chaincodeID;
        var newuser;

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
                    newuser = yield* registerAndEnrollUser(config.newUserAffiliation);
                } catch (err) {
                    expect.fail(err, null, err.message);
                }
            })
        }

        it('should be able to deploy chaincode', function* () {
            if (!config.skipDeploy) {
                this.timeout(60000);
                console.log("Starting deploying chaincode");
                try {
                    var chaincodePath = config.regularChaincode.chaincodePath;
                    var args = config.regularChaincode.chaincodeInitArgs;
                    var user = yield hyperledgerUtil.getUser(newuser);
                    var tx = yield hyperledgerUtil.deployChaincode(user, args, chaincodePath);
                    chaincodeID = yield* waitForDeployTransaction(tx);
                } catch (err) {
                    expect.fail(err, null, err.message);
                }
            } else {
                this.timeout(15000);
                chaincodeID = config.regularChaincode.chaincodeID;
                console.log("Skipping chaincode deploy, just initializing already deployed chaincode", chaincodeID);
                yield* invokeChaincodeAndVerify(newuser, chaincodeID, config.regularChaincode, true, true);
            }
        })

        it('should be able to query chaincode', function* () {
            this.timeout(5000);
            console.log("Starting querying chaincode");
            try {
                var tx = yield* queryChaincode(newuser, chaincodeID, config.regularChaincode.chaincodeQueryFn,
                    config.regularChaincode.chaincodeQueryArgs);
                yield* waitForQueryTransactionAndVerify(tx, config.regularChaincode.chaincodeQueryResult);
            } catch (err) {
                expect.fail(err, null, err.message);
            }
        })

        it('should be able to invoke chaincode', function* () {
            this.timeout(15000);
            console.log("Starting invoking chaincode");
            try {
                var args = config.chaincodeInvokeArgs;
                yield* invokeChaincodeAndVerify(newuser, chaincodeID, config.regularChaincode);
            } catch (err) {
                expect.fail(err, null, err.message);
            }
        })
    })

    if (config.acaEnabled) {
        var validUser;
        var invalidUser;
        var chaincodeID = config.acaChaincode.chaincodeID;
        var attrs = [config.acaChaincode.chaincodeInitArgs[0]];

        describe('ACA chaincode', function () {
            it('should register and enroll new users with attributes', function* () {
                try {
                    console.log("Register user with valid attributes");
                    var validAttributes = [{
                        name: config.acaChaincode.chaincodeInitArgs[0],
                        value: config.acaChaincode.chaincodeInitArgs[1]
                    }]
                    validUser = yield* registerAndEnrollUser(config.newUserAffiliation, false,
                        validAttributes);
                    console.log("User with valid attributes", validUser);

                    console.log("Register user with invalid attributes");
                    var invalidAttributes = [{
                        name: config.acaChaincode.chaincodeInitArgs[0],
                        value: config.acaChaincode.chaincodeInitArgs[1] + "foo"
                    }]
                    invalidUser = yield* registerAndEnrollUser(config.newUserAffiliation, false,
                        invalidAttributes);
                    console.log("User with invalid attributes", invalidUser);
                } catch (err) {
                    expect.fail(err, null, err.message);
                }
            })

            it('should deploy aca chaincode', function* () {
                try {
                    var user = yield hyperledgerUtil.getUser(validUser);
                    if (!config.skipDeploy) {
                        this.timeout(60000);
                        console.log("Starting deploying chaincode");
                        var chaincodePath = config.acaChaincode.chaincodePath;
                        var args = config.acaChaincode.chaincodeInitArgs;
                        var tx = yield hyperledgerUtil.deployChaincode(user, args, chaincodePath);
                        chaincodeID = yield* waitForDeployTransaction(tx);
                    } else {
                        this.timeout(15000);
                        chaincodeID = config.acaChaincode.chaincodeID;
                        console.log("Skipping chaincode deploy, just initializing already deployed chaincode", chaincodeID);
                        yield* invokeChaincodeAndVerify(validUser, chaincodeID, config.acaChaincode,
                            true, true, attrs);
                    }
                } catch (err) {
                    expect.fail(err, null, err.message);
                }
            })

            it('should be able to query cert attribute', function* () {
                this.timeout(5000);
                console.log("Starting querying chaincode");
                try {
                    var tx = yield* queryChaincode(validUser, chaincodeID, "attributes",
                        config.acaChaincode.chaincodeQueryArgs, attrs);
                    yield* waitForQueryTransactionAndVerify(tx, "admin");
                } catch (err) {
                    expect.fail(err, null, err.message);
                }
            })

            it('any user should be able to query chaincode', function* () {
                this.timeout(5000);
                console.log("Starting querying chaincode");
                try {
                    var tx = yield* queryChaincode(invalidUser, chaincodeID,
                        config.acaChaincode.chaincodeQueryFn, config.acaChaincode.chaincodeQueryArgs, attrs);
                    yield* waitForQueryTransactionAndVerify(tx, config.acaChaincode.chaincodeQueryResult);
                } catch (err) {
                    expect.fail(err, null, err.message);
                }
            })

            it('user with valid attribute should be able to invoke chaincode', function* () {
                this.timeout(15000);
                console.log("Starting invoking chaincode");
                try {
                    var args = config.chaincodeInvokeArgs;
                    yield* invokeChaincodeAndVerify(validUser, chaincodeID, config.acaChaincode,
                        false, false, attrs);
                } catch (err) {
                    expect.fail(err, null, err.message);
                }
            })

            it('user with invalid attribute should not be able to invoke chaincode', function* () {
                this.timeout(15000);
                console.log("Starting invoking chaincode");
                try {
                    var args = config.chaincodeInvokeArgs;
                    // Value of counter should remain to be the result of invoke operation and not be reset
                    yield* invokeChaincodeAndVerify(invalidUser, chaincodeID, config.acaChaincode,
                        true, false, attrs);
                } catch (err) {
                    expect.fail(err, null, err.message);
                }
            })

        })
    }

});