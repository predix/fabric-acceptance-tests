var expect = require('expect.js');
var hyperledgerUtil = require('./utils/hyperledgerUtil');
var config = require('./config/config');
var Promise = require('bluebird');
var mocha = require('mocha')
var coMocha = require('co-mocha')

coMocha(mocha)

describe('Blockchain', function() {
    var chaincodeID;

    before(function*() {
        expect(config.membershipAddress).not.to.be(undefined);
        expect(config.membershipAddress).not.to.be.empty();
        expect(config.peers).not.to.be(undefined);
        expect(config.peers).not.to.be.empty();
        hyperledgerUtil.setupChain("predixBlockchain", config.membershipAddress, config.peers, "/Users/geoss/tmp/keyValStore");
    })

    it('should be able to enroll registrar', function*() {
        console.log("Starting enrolling user");
        try {
            yield hyperledgerUtil.enrollRegistrar("WebAppAdmin1", "DJY27pEnl16d");
            console.log("Done enrolling registrar");
            var registrar = hyperledgerUtil.getRegistrar();
            expect(registrar.getName()).to.be('WebAppAdmin1');
        } catch (err) {
            expect().fail(err.message);
        }
    });

    it('should be able to enroll a regular user', function*() {
        console.log("Starting enrolling user");
        try {
            yield hyperledgerUtil.enrollUser("system_chaincode_invoker", "DRJ20pEql15a");
        } catch (err) {
            expect().fail(err.message);
        }
    });

    it('should register and enroll a new user', function*() {
        console.log("Starting registering new user");
        try {
            var name = "newuser";
            var enrollmentSecret = yield hyperledgerUtil.registerUser(name);
            console.log("Enrollment secret for", name, "is", enrollmentSecret);
            yield hyperledgerUtil.enrollUser(name, enrollmentSecret);
            console.log("Successfully registered and enrolled a new user", name);
        } catch (err) {
            expect().fail(err.message);
        }
    });

    it('should be able to deploy chaincode', function*(done) {
        this.timeout(30000);
        console.log("Starting deploying chaincode");
        try {
            var chaincodePath = "github.com/predix/chaincode_example/chaincode_example01";
            var args = ["a", "500", "b", "100"];
            var user = yield hyperledgerUtil.getUser("newuser");
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

    it.only('should be able to query chaincode', function*(done) {
        this.timeout(30000);
        console.log("Starting querying chaincode");
        try {
            var chaincodeID = "3be65a2f291efd2f8d1f1b3d7bda5022e25689313840b1b465a7ff304c452d34c825d102c8a828665791140dd29213b79851de82cd6d21e78b8dad3bbb32ca8e";
            var args = ["c"];
            var user = yield hyperledgerUtil.getUser("newuser");
            var tx = yield hyperledgerUtil.queryChaincode(user, args, chaincodeID);
            tx.on('complete', function(results) {
                // Deploy request completed successfully
                console.log("query results", results.result.toString());
                // Set the testChaincodeID for subsequent tests
                // chaincodeID = results.chaincodeID;
                // console.log("Successfully deployed chaincode", chaincodeID)
                done();
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

});