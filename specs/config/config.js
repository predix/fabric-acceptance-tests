module.exports = {
  blockchainName:         "predixBlockchain",
  peers:                  "10.244.8.3:30303,10.244.8.4:30303,10.244.9.2:30303",
  ca:                     "10.244.8.2:50051",
  registrarUserName:      "WebAppAdmin",
  registrarPassword:      "DJY27pEnl16d",
  userName:               "diego",
  password:               "DRJ23pEQl16a",
  chaincodePath:          "github.com/predix/chaincode_example/chaincode_example01",
  chaincodeInitArgs:      ["test1", "800", "test2", "1000"],
  chaincodeInvokeArgs:    ["test1", "test2", "10"],
  chaincodeQueryArgs:     ["test1"],
  chaincodeQueryResult:    "800",
  chaincodeInvokeResult:   "780",
  keyValueLocation:        "/Users/geoss/tmp/keyValStore",
  newUserAffiliation:      "institution_a"
};
