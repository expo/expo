/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConnectionContextStore.h"
#include <folly/json.h>
#include <folly/portability/SysStat.h>
#include <fstream>
#include <iostream>
#include "CertificateUtils.h"
#include "Log.h"
using namespace facebook::flipper;

static constexpr auto CSR_FILE_NAME = "app.csr";
static constexpr auto FLIPPER_CA_FILE_NAME = "sonarCA.crt";
static constexpr auto CLIENT_CERT_FILE_NAME = "device.crt";
static constexpr auto PRIVATE_KEY_FILE = "privateKey.pem";
static constexpr auto CONNECTION_CONFIG_FILE = "connection_config.json";

bool fileExists(std::string fileName);
std::string loadStringFromFile(std::string fileName);
void writeStringToFile(std::string content, std::string fileName);

ConnectionContextStore::ConnectionContextStore(DeviceData deviceData)
    : deviceData_(deviceData) {}

bool ConnectionContextStore::hasRequiredFiles() {
  std::string caCert =
      loadStringFromFile(absoluteFilePath(FLIPPER_CA_FILE_NAME));
  std::string clientCert =
      loadStringFromFile(absoluteFilePath(CLIENT_CERT_FILE_NAME));
  std::string privateKey =
      loadStringFromFile(absoluteFilePath(PRIVATE_KEY_FILE));

  if (caCert == "" || clientCert == "" || privateKey == "") {
    return false;
  }
  return true;
}

std::string ConnectionContextStore::getCertificateSigningRequest() {
  // Use in-memory CSR if already loaded
  if (csr != "") {
    return csr;
  }

  // Attempt to load existing CSR from previous run of the app
  csr = loadStringFromFile(absoluteFilePath(CSR_FILE_NAME));
  if (csr != "") {
    return csr;
  }

  // Clean all state and generate a new one
  resetState();
  bool success = generateCertSigningRequest(
      deviceData_.appId.c_str(),
      absoluteFilePath(CSR_FILE_NAME).c_str(),
      absoluteFilePath(PRIVATE_KEY_FILE).c_str());
  if (!success) {
    throw new std::runtime_error("Failed to generate CSR");
  }
  csr = loadStringFromFile(absoluteFilePath(CSR_FILE_NAME));

  return csr;
}

std::shared_ptr<SSLContext> ConnectionContextStore::getSSLContext() {
  std::shared_ptr<folly::SSLContext> sslContext =
      std::make_shared<folly::SSLContext>();
  sslContext->loadTrustedCertificates(
      absoluteFilePath(FLIPPER_CA_FILE_NAME).c_str());
  sslContext->setVerificationOption(
      folly::SSLContext::SSLVerifyPeerEnum::VERIFY);
  sslContext->loadCertKeyPairFromFiles(
      absoluteFilePath(CLIENT_CERT_FILE_NAME).c_str(),
      absoluteFilePath(PRIVATE_KEY_FILE).c_str());
  sslContext->authenticate(true, false);
  return sslContext;
}

std::string ConnectionContextStore::getDeviceId() {
  /* On android we can't reliably get the serial of the current device
     So rely on our locally written config, which is provided by the
     desktop app.
     For backwards compatibility, when this isn't present, fall back to the
     unreliable source. */
  try {
    std::string config =
        loadStringFromFile(absoluteFilePath(CONNECTION_CONFIG_FILE));
    auto maybeDeviceId = folly::parseJson(config)["deviceId"];
    return maybeDeviceId.isString() ? maybeDeviceId.getString()
                                    : deviceData_.deviceId;
  } catch (std::exception&) {
    return deviceData_.deviceId;
  }
}

void ConnectionContextStore::storeConnectionConfig(folly::dynamic& config) {
  std::string json = folly::toJson(config);
  writeStringToFile(json, absoluteFilePath(CONNECTION_CONFIG_FILE));
}

std::string ConnectionContextStore::absoluteFilePath(const char* filename) {
  return std::string(deviceData_.privateAppDirectory + "/sonar/" + filename);
}

std::string ConnectionContextStore::getCertificateDirectoryPath() {
  return absoluteFilePath("");
}

bool ConnectionContextStore::resetState() {
  // Clear in-memory state
  csr = "";

  // Delete state from disk
  std::string dirPath = absoluteFilePath("");
  struct stat info;
  if (stat(dirPath.c_str(), &info) != 0) {
    int ret = mkdir(dirPath.c_str(), S_IRUSR | S_IWUSR | S_IXUSR);
    return ret == 0;
  } else if (info.st_mode & S_IFDIR) {
    for (auto file : {CSR_FILE_NAME,
                      FLIPPER_CA_FILE_NAME,
                      CLIENT_CERT_FILE_NAME,
                      PRIVATE_KEY_FILE,
                      CONNECTION_CONFIG_FILE}) {
      std::remove(absoluteFilePath(file).c_str());
    }
    return true;
  } else {
    log("ERROR: Flipper path exists but is not a directory: " + dirPath);
    return false;
  }
}

std::string loadStringFromFile(std::string fileName) {
  if (!fileExists(fileName)) {
    return "";
  }
  std::stringstream buffer;
  std::ifstream stream;
  std::string line;
  stream.open(fileName.c_str());
  if (!stream) {
    log("ERROR: Unable to open ifstream: " + fileName);
    return "";
  }
  buffer << stream.rdbuf();
  std::string s = buffer.str();
  return s;
}

void writeStringToFile(std::string content, std::string fileName) {
  std::ofstream out(fileName);
  out << content;
}

bool fileExists(std::string fileName) {
  struct stat buffer;
  return stat(fileName.c_str(), &buffer) == 0;
}
