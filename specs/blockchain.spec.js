var expect = require('expect.js');
var hyperledgerUtil = require('./utils/hyperledgerUtil.js');
var config = require('./config/config.js');
var Promise = require('bluebird');

describe('Blockchain suite', function() {
    before(function() {
        expect(config.membershipAddress).not.to.be(undefined);
        expect(config.membershipAddress).not.to.be.empty();
        expect(config.peers).not.to.be(undefined);
        expect(config.peers).not.to.be.empty();
        hyperledgerUtil.setupChain('predixBlockchain', config.membershipAddress, config.peers);
    })

    it('should be able to enroll registrar', function(done) {
        console.log("Starting enrolling user");
        var enrollUser = Promise.promisify(hyperledgerUtil.enrollUser)
        enrollUser("someuser", "doesntmatter").then(function() {
        	console.log("Successfully enrolled----")
            done()
        }).catch(function(err) {
        	console.log("Error in enrolling user ", err)
            expect().fail(err.message);
            done();
        })
    });
});