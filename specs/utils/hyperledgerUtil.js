var bluebird = require('bluebird');
var hfc = require('hfc');
var fs = require('fs');

var chain;

function* setupChain(chainName, caAddr, peers, keystoreLocation) {
    chain = hfc.newChain(chainName);
    console.log("Adding membership service ", caAddr);
    chain.setMemberServicesUrl("grpc://" + caAddr);
    peers.split(",").forEach(peer => {
        console.log("Adding peer ", peer);
        chain.addPeer("grpc://" + peer);
    });
    chain.setKeyValStore(hfc.newFileKeyValStore(keystoreLocation));
    console.log("Setup the keyval store");
}

function* getUser(name) {
    var getUser = bluebird.promisify(chain.getUser, {
        context: chain
    });
    var user = yield getUser(name);
    return user;
}

function* enrollRegistrar(name, passwd) {
    console.log("Entering enrollRegistrar");
    var user = yield * enrollUser(name, passwd);
    chain.setRegistrar(user);
    console.log("Successfully enrolled registrar");
    return user;
}

function* enrollUser(name, passwd) {
    console.log("Entering enrollUser");
    var client = yield * getUser(name);
    console.log("Successfully got the user ", name);
    if (client.isEnrolled()) {
        console.log("Client", client.getName(), "is already enrolled");
        return client;
    }
    var enroll = bluebird.promisify(client.enroll, {
        context: client
    });
    yield enroll(passwd);
    console.log("Successfully enrolled user", name);
    var path = chain.getKeyValStore().dir + "/member." + client.getName();
    var exists = fs.existsSync(path);
    if (!exists) {
        console.log("Failed to store client certs for", client.getName(), ", error:", err);
        throw new Error("Failed to store client token")
    }
    console.log("Successfully stored client certs");
    return client
}

function getRegistrar() {
    return chain.getRegistrar();
}

function* registerUser(name) {
    console.log("Entering registerUser");
    var user = yield * getUser(name);
    var registerUsr = bluebird.promisify(user.register, {
        context: user
    });
    var registrationRequest = {
        enrollmentID: name,
        affiliation: "institution_a"
    };
    var secret = yield registerUsr(registrationRequest);
    console.log("Registered user", name);
    return secret;
}

function* deployChaincode(user, args, chaincodePath) {
    console.log("Entering deployChaincode");
    var deployRequest = {
        chaincodePath: chaincodePath,
        fcn: "init",
        args: args
    }
    var deployTx = user.deploy(deployRequest);
    console.log("Submitted deploy transaction");
    return deployTx;
}

function* queryChaincode(user, args, chaincodeID) {
    console.log("Entering queryChaincode");
    var queryRequest = {
        chaincodeID: chaincodeID,
        fcn: "query",
        args: args
    }
    var queryTx = user.query(queryRequest);
    console.log("Submitted query transaction");
    return queryTx;
}

module.exports = {
    getRegistrar: getRegistrar,
    getUser: bluebird.coroutine(getUser),
    setupChain: bluebird.coroutine(setupChain),
    enrollUser: bluebird.coroutine(enrollUser),
    enrollRegistrar: bluebird.coroutine(enrollRegistrar),
    registerUser: bluebird.coroutine(registerUser),
    deployChaincode: bluebird.coroutine(deployChaincode),
    queryChaincode: bluebird.coroutine(queryChaincode)
}