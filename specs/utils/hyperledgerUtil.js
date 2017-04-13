var Promise = require('bluebird');
// var request = require('request')
var hfc = require('hfc');
var fs = require('fs');

var hyperledgerUtil = function() {
    var chain;

    this.setupChain = function(chainName, caAddr, peers) {
        // Name could be the service instance name that we get from env
        chain = hfc.newChain(chainName);
        console.log("Adding membership service ", caAddr);
        chain.setMemberServicesUrl("grpc://" + caAddr);
        peers.split(",").forEach(peer => {
            console.log("Adding peer ", peer);
            chain.addPeer("grpc://" + peer);
        });
        chain.setKeyValStore(hfc.newFileKeyValStore("/Users/geoss/tmp/keyValStore"));
        console.log("Setup the keyval store");
    }

    this.enrollUser = function(name, passwd) {
        chain.getMember(name, function(err, client) {
            if (err) {
                console.log("Failed to get user ", name);
                throw new Error(err.message);
            } else {
                console.log("Successfully got the user ", name);
                client.enroll(passwd, function(err, crypto) {
                    if (err) {
                        console.log("Failed to enroll user ", name);
                        throw new Error(err.message);
                    } else {
                        console.log("Successfully enrolled user ", name);
                        var path = chain.getKeyValStore().dir + "/member." + WebAppAdmin.getName();
                        fs.exists(path, function(exists) {
                            if (exists) {
                                console.log("Successfully stored client token");
                            } else {
                                console.log("Failed to store client token for " + client.getName() + ", error: " + err);
                                throw new Error(err.message);
                            }
                        });
                    }
                });
                console.log("Done enrolling")
            }
        });
    }
}

module.exports = new hyperledgerUtil();