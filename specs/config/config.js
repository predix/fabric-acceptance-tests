module.exports = {
  blockchainName:         "predixBlockchain",
  peers:                  "10.244.8.3:30303,10.244.8.4:30303,10.244.9.2:30303",
  ca:                     "10.244.8.2:50051",
  registrarUserName:      "WebAppAdmin",
  registrarPassword:      "DJY27pEnl16d",
  userName:               "diego",
  password:               "DRJ23pEQl16a",
  chaincodePath:          "github.com/predix/chaincode_example/chaincode_example01",
  chaincodeInitArgs:      ["test1", "1800", "test2", "2000"],
  chaincodeQueryArgs:     ["test1"],
  chaincodeQueryResult:   "1800",
  chaincodeInvokeArgs:    ["test1", "test2", "10"],
  chaincodeInvokeResult:  "1780",
  keyValueLocation:       "/Users/geoss/tmp/keyValStore",
  vaultUrl:               "http://127.0.0.1:8200/v1/secret/myinstance",
  vaultToken:             "ea13ea6e-80ee-1761-fddf-f0ed4ec66aed",
  newUserAffiliation:     "institution_a",
  chaincodeID:            "456d1b8f7bcb233530e1004a7ea312058d11b7f1b33e51ad44994652c16f7124",
  chaincodeSetArgs:       ["test1", "1800", "test2", "2000"],
  skipDeploy:             process.env.SKIP_DEPLOY === 'true',
  useNewUser:             process.env.USE_NEW_USER === 'true'
};
