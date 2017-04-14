'use strict';

var expect          = require('expect.js');
var hyperledgerUtil = require('./utils/hyperledgerUtil');
var config          = require('./config/config');
var Promise         = require('bluebird');
var mocha           = require('mocha');
var coMocha         = require('co-mocha');
var randomstring    = require('randomstring');

coMocha(mocha)

describe('Blockchain', function() {
    var chaincodeID;
    var newuser;

    before(function*() {
        expect(config.ca).not.to.be(undefined);
        expect(config.ca).not.to.be.empty();
        expect(config.peers).not.to.be(undefined);
        expect(config.peers).not.to.be.empty();
        hyperledgerUtil.setupChain(config.blockchainName, config.ca, config.peers, config.keyValueLocation);
    })

    it('should be able to enroll registrar', function*() {
        console.log("Starting enrolling user");
        try {
            yield hyperledgerUtil.enrollRegistrar(config.registrarUserName, config.registrarPassword);
            console.log("Done enrolling registrar");
            var registrar = hyperledgerUtil.getRegistrar();
            expect(registrar.getName()).to.be(config.registrarUserName);
        } catch (err) {
            expect().fail(err.message);
        }
    })

    it('should be able to enroll a regular user', function*() {
        console.log("Starting enrolling user");
        try {
            yield hyperledgerUtil.enrollUser(config.userName, config.password);
        } catch (err) {
            expect().fail(err.message);
        }
    })

    it('should register and enroll a new user', function*() {
        console.log("Starting registering new user");
        try {
            newuser = randomstring.generate({
                length: 8,
                charset: 'alphabetic'
            });
            console.log("Registering new user", newuser);
            var enrollmentSecret = yield hyperledgerUtil.registerUser(newuser);
            console.log("Enrollment secret for", newuser, "is", enrollmentSecret);
            yield hyperledgerUtil.enrollUser(newuser, enrollmentSecret);
            console.log("Successfully registered and enrolled a new user", newuser);
        } catch (err) {
            expect().fail(err.message);
        }
    })

    it('should be able to deploy chaincode', function*(done) {
        this.timeout(30000);
        console.log("Starting deploying chaincode");
        try {
            var chaincodePath = config.chaincodePath;
            var args = config.chaincodeInitArgs;
            var user = yield hyperledgerUtil.getUser(newuser);
            var tx = yield hyperledgerUtil.deployChaincode(user, args, chaincodePath);
            tx.on('complete', function(results) {
                // Deploy request completed successfully
                console.log("deploy results", results);
                // Set the testChaincodeID for subsequent tests
                chaincodeID = results.chaincodeID;
                console.log("Successfully deployed chaincode", chaincodeID)
                done();
            });
            tx.on('error', function(err) {
                console.log("Failed to deploy chaincode", err)
                done(err);
            });
        } catch (err) {
            expect().fail(err.message);
        }
    })

    it.skip('should be able to query chaincode', function*(done) {
        this.timeout(5000);
        console.log("Starting querying chaincode");
        try {
        	// TODO: remove declararion of chaincodeID here and use the global one that is deployed in previous test
            var chaincodeID = "3be65a2f291efd2f8d1f1b3d7bda5022e25689313840b1b465a7ff304c452d34c825d102c8a828665791140dd29213b79851de82cd6d21e78b8dad3bbb32ca8e";
            var args = config.chaincodeQueryArgs;
            var user = yield hyperledgerUtil.getUser(newuser);
            var tx = yield hyperledgerUtil.queryChaincode(user, args, chaincodeID);
            tx.on('complete', function(results) {
                // Deploy request completed successfully
                var bal = results.result.toString();
                console.log("query results", bal);
                expect(bal).to.be(config.chaincodeQueryResult)
                // Set the testChaincodeID for subsequent tests
                // chaincodeID = results.chaincodeID;
                // console.log("Successfully deployed chaincode", chaincodeID)
                // done();
            });
            tx.on('error', function(err) {
                console.log("Failed to query chaincode", err)
                expect().fail(err.message);
                // done(err);
            });
        } catch (err) {
            expect().fail(err.message);
        }
    })

    it.skip('should be able to invoke chaincode', function*(done) {
        this.timeout(5000);
        console.log("Starting invoking chaincode");
        try {
            // TODO: remove declararion of chaincodeID here and use the global one that is deployed in previous test
            var chaincodeID = "3be65a2f291efd2f8d1f1b3d7bda5022e25689313840b1b465a7ff304c452d34c825d102c8a828665791140dd29213b79851de82cd6d21e78b8dad3bbb32ca8e";
            var args = config.chaincodeInvokeArgs;
            var user = yield hyperledgerUtil.getUser(newuser);
            var tx = yield hyperledgerUtil.invokeChaincode(user, args, chaincodeID);
            tx.on('submitted', function(results) {
                // Deploy request completed successfully
                console.log("invoke results", results);
                // done();
            });
            tx.on('error', function(err) {
                console.log("Failed to invoke chaincode", err)
                    // expect().fail(err.message);
                    // done(err);
            });
        } catch (err) {
            expect().fail(err.message);
        }
    })

});