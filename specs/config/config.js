'use strict';

module.exports = {
  peers:                  process.env.BLOCKCHAIN_PEERS,
  membershipAddress:      process.env.BLOCKCHAIN_CA,
  userName:               process.env.BLOCKCHAIN_USERNAME,
  password:               process.env.BLOCKCHAIN_PASSWORD,
};
