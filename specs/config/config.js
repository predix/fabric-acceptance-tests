module.exports = {
  blockchainName:         "predixBlockchain",
  peers:                  "10.244.8.3:30303,10.244.8.4:30303,10.244.9.2:30303",
  ca:                     "10.244.8.2:50051",
  registrarUserName:      "WebAppAdmin1",
  registrarPassword:      "DJY27pEnl16d",
  userName:               "diego",
  password:               "DRJ23pEQl16a",
  chaincodePath:          "github.com/predix/chaincode_example/chaincode_example01",
  chaincodeInitArgs:      ["c", "450", "d", "700"],
  chaincodeInvokeArgs:    ["d", "c", "10"],
  chaincodeQueryArgs:     ["c"],
  chaincodeQueryResult:    "450",
  chaincodeInvokeResult:   "470",
  keyValueLocation:        "/tmp/keyValStore"
};
