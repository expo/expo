/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FlipperConnectionManagerImpl.h"
#include <folly/String.h>
#include <folly/futures/Future.h>
#include <folly/io/async/AsyncSocketException.h>
#include <folly/io/async/SSLContext.h>
#include <folly/json.h>
#include <rsocket/Payload.h>
#include <rsocket/RSocket.h>
#include <rsocket/transports/tcp/TcpConnectionFactory.h>
#include <stdexcept>
#include <thread>
#include "ConnectionContextStore.h"
#include "FireAndForgetBasedFlipperResponder.h"
#include "FlipperRSocketResponder.h"
#include "FlipperResponderImpl.h"
#include "FlipperStep.h"
#include "Log.h"
#include "yarpl/Single.h"

#define WRONG_THREAD_EXIT_MSG \
  "ERROR: Aborting flipper initialization because it's not running in the flipper thread."

static constexpr int reconnectIntervalSeconds = 2;
static constexpr int connectionKeepaliveSeconds = 10;

static constexpr int maxPayloadSize = 0xFFFFFF;

// Not a public-facing version number.
// Used for compatibility checking with desktop flipper.
// To be bumped for every core platform interface change.
static constexpr int sdkVersion = 4;

namespace facebook {
namespace flipper {

class ConnectionEvents : public rsocket::RSocketConnectionEvents {
 private:
  FlipperConnectionManagerImpl* websocket_;

 public:
  ConnectionEvents(FlipperConnectionManagerImpl* websocket)
      : websocket_(websocket) {}

  void onConnected() {
    websocket_->isOpen_ = true;
    if (websocket_->connectionIsTrusted_) {
      websocket_->callbacks_->onConnected();
    }
  }

  void onDisconnected(const folly::exception_wrapper&) {
    if (!websocket_->isOpen_)
      return;
    websocket_->isOpen_ = false;
    if (websocket_->connectionIsTrusted_) {
      websocket_->connectionIsTrusted_ = false;
      websocket_->callbacks_->onDisconnected();
    }
    websocket_->reconnect();
  }

  void onClosed(const folly::exception_wrapper& e) {
    onDisconnected(e);
  }
};

FlipperConnectionManagerImpl::FlipperConnectionManagerImpl(
    FlipperInitConfig config,
    std::shared_ptr<FlipperState> state,
    std::shared_ptr<ConnectionContextStore> contextStore)
    : deviceData_(config.deviceData),
      flipperState_(state),
      insecurePort(config.insecurePort),
      securePort(config.securePort),
      flipperEventBase_(config.callbackWorker),
      connectionEventBase_(config.connectionWorker),
      contextStore_(contextStore) {
  CHECK_THROW(config.callbackWorker, std::invalid_argument);
  CHECK_THROW(config.connectionWorker, std::invalid_argument);
}

FlipperConnectionManagerImpl::~FlipperConnectionManagerImpl() {
  stop();
}

void FlipperConnectionManagerImpl::setCertificateProvider(
    const std::shared_ptr<FlipperCertificateProvider> provider) {
  certProvider_ = provider;
};

std::shared_ptr<FlipperCertificateProvider>
FlipperConnectionManagerImpl::getCertificateProvider() {
  return certProvider_;
};

void FlipperConnectionManagerImpl::start() {
  if (isStarted_) {
    log("Already started");
    return;
  }
  isStarted_ = true;

  auto step = flipperState_->start("Start connection thread");

  folly::makeFuture()
      .via(flipperEventBase_->getEventBase())
      .delayed(std::chrono::milliseconds(0))
      .thenValue([this, step](auto&&) {
        step->complete();
        startSync();
      });
}

void FlipperConnectionManagerImpl::startSync() {
  if (!isStarted_) {
    log("Not started");
    return;
  }
  if (!isRunningInOwnThread()) {
    log(WRONG_THREAD_EXIT_MSG);
    return;
  }
  if (isOpen()) {
    log("Already connected");
    return;
  }
  bool isClientSetupStep = isCertificateExchangeNeeded();
  auto step = flipperState_->start(
      isClientSetupStep ? "Establish pre-setup connection"
                        : "Establish main connection");
  try {
    if (isClientSetupStep) {
      bool success = doCertificateExchange();
      if (!success) {
        reconnect();
        return;
      }
    } else {
      if (!connectSecurely()) {
        // The expected code path when flipper desktop is not running.
        // Don't count as a failed attempt, or it would invalidate the
        // connection files for no reason. On iOS devices, we can always connect
        // to the local port forwarding server even when it can't connect to
        // flipper. In that case we get a Network error instead of a Port not
        // open error, so we treat them the same.
        step->fail(
            "No route to flipper found. Is flipper desktop running? Retrying...");
        reconnect();
      }
    }
    step->complete();
  } catch (const folly::AsyncSocketException& e) {
    if (e.getType() == folly::AsyncSocketException::SSL_ERROR) {
      auto message = std::string(e.what()) +
          "\nMake sure the date and time of your device is up to date.";
      log(message);
      step->fail(message);
    } else {
      log(e.what());
      step->fail(e.what());
    }
    failedConnectionAttempts_++;
    reconnect();
  } catch (const std::exception& e) {
    log(e.what());
    step->fail(e.what());
    failedConnectionAttempts_++;
    reconnect();
  }
}

bool FlipperConnectionManagerImpl::doCertificateExchange() {
  rsocket::SetupParameters parameters;
  folly::SocketAddress address;
  int medium = certProvider_ != nullptr
      ? certProvider_->getCertificateExchangeMedium()
      : FlipperCertificateExchangeMedium::FS_ACCESS;

  parameters.payload = rsocket::Payload(folly::toJson(folly::dynamic::object(
      "os", deviceData_.os)("device", deviceData_.device)(
      "app", deviceData_.app)("sdk_version", sdkVersion)("medium", medium)));
  address.setFromHostPort(deviceData_.host, insecurePort);

  auto connectingInsecurely = flipperState_->start("Connect insecurely");
  connectionIsTrusted_ = false;
  auto newClient =
      rsocket::RSocket::createConnectedClient(
          std::make_unique<rsocket::TcpConnectionFactory>(
              *connectionEventBase_->getEventBase(), std::move(address)),
          std::move(parameters),
          nullptr,
          std::chrono::seconds(connectionKeepaliveSeconds), // keepaliveInterval
          nullptr, // stats
          std::make_shared<ConnectionEvents>(this))
          .thenError<folly::AsyncSocketException>([](const auto& e) {
            if (e.getType() == folly::AsyncSocketException::NOT_OPEN ||
                e.getType() == folly::AsyncSocketException::NETWORK_ERROR) {
              // This is the state where no Flipper desktop client is connected.
              // We don't want an exception thrown here.
              return std::unique_ptr<rsocket::RSocketClient>(nullptr);
            }
            throw e;
          })
          .get();

  if (newClient.get() == nullptr) {
    connectingInsecurely->fail("Failed to connect");
    return false;
  }

  client_ = std::move(newClient);
  connectingInsecurely->complete();

  auto resettingState = flipperState_->start("Reset state");
  contextStore_->resetState();
  resettingState->complete();

  requestSignedCertFromFlipper();
  return true;
}

bool FlipperConnectionManagerImpl::connectSecurely() {
  rsocket::SetupParameters parameters;
  folly::SocketAddress address;

  auto loadingDeviceId = flipperState_->start("Load Device Id");
  auto deviceId = contextStore_->getDeviceId();
  if (deviceId.compare("unknown")) {
    loadingDeviceId->complete();
  }
  int medium = certProvider_ != nullptr
      ? certProvider_->getCertificateExchangeMedium()
      : FlipperCertificateExchangeMedium::FS_ACCESS;

  parameters.payload = rsocket::Payload(folly::toJson(folly::dynamic::object(
      "csr", contextStore_->getCertificateSigningRequest().c_str())(
      "csr_path", contextStore_->getCertificateDirectoryPath().c_str())(
      "os", deviceData_.os)("device", deviceData_.device)(
      "device_id", deviceId)("app", deviceData_.app)("medium", medium)(
      "sdk_version", sdkVersion)));
  address.setFromHostPort(deviceData_.host, securePort);

  std::shared_ptr<folly::SSLContext> sslContext =
      contextStore_->getSSLContext();
  auto connectingSecurely = flipperState_->start("Connect securely");
  connectionIsTrusted_ = true;

  auto newClient =
      rsocket::RSocket::createConnectedClient(
          std::make_unique<rsocket::TcpConnectionFactory>(
              *connectionEventBase_->getEventBase(),
              std::move(address),
              std::move(sslContext)),
          std::move(parameters),
          std::make_shared<FlipperRSocketResponder>(this, connectionEventBase_),
          std::chrono::seconds(connectionKeepaliveSeconds), // keepaliveInterval
          nullptr, // stats
          std::make_shared<ConnectionEvents>(this))
          .thenError<folly::AsyncSocketException>([](const auto& e) {
            if (e.getType() == folly::AsyncSocketException::NOT_OPEN ||
                e.getType() == folly::AsyncSocketException::NETWORK_ERROR) {
              // This is the state where no Flipper desktop client is connected.
              // We don't want an exception thrown here.
              return std::unique_ptr<rsocket::RSocketClient>(nullptr);
            }
            throw e;
          })
          .get();
  if (newClient.get() == nullptr) {
    connectingSecurely->fail("Failed to connect");
    return false;
  }

  client_ = std::move(newClient);
  connectingSecurely->complete();
  failedConnectionAttempts_ = 0;
  return true;
}

void FlipperConnectionManagerImpl::reconnect() {
  if (!isStarted_) {
    log("Not started");
    return;
  }
  folly::makeFuture()
      .via(flipperEventBase_->getEventBase())
      .delayed(std::chrono::seconds(reconnectIntervalSeconds))
      .thenValue([this](auto&&) { startSync(); });
}

void FlipperConnectionManagerImpl::stop() {
  if (certProvider_ && certProvider_->shouldResetCertificateFolder()) {
    contextStore_->resetState();
  }
  if (!isStarted_) {
    log("Not started");
    return;
  }
  isStarted_ = false;

  if (client_) {
    client_->disconnect();
  }
  client_ = nullptr;
}

bool FlipperConnectionManagerImpl::isOpen() const {
  return isOpen_ && connectionIsTrusted_;
}

void FlipperConnectionManagerImpl::setCallbacks(Callbacks* callbacks) {
  callbacks_ = callbacks;
}

void FlipperConnectionManagerImpl::sendMessage(const folly::dynamic& message) {
  flipperEventBase_->add([this, message]() {
    try {
      rsocket::Payload payload = toRSocketPayload(message);
      if (client_) {
        client_->getRequester()
            ->fireAndForget(std::move(payload))
            ->subscribe([]() {});
      }
    } catch (std::length_error& e) {
      // Skip sending messages that are too large.
      log(e.what());
      return;
    }
  });
}

void FlipperConnectionManagerImpl::onMessageReceived(
    const folly::dynamic& message,
    std::unique_ptr<FlipperResponder> responder) {
  callbacks_->onMessageReceived(message, std::move(responder));
}

bool FlipperConnectionManagerImpl::isCertificateExchangeNeeded() {
  if (failedConnectionAttempts_ >= 2) {
    return true;
  }

  auto step = flipperState_->start("Check required certificates are present");
  bool hasRequiredFiles = contextStore_->hasRequiredFiles();
  if (hasRequiredFiles) {
    step->complete();
  }
  return !hasRequiredFiles;
}

void FlipperConnectionManagerImpl::requestSignedCertFromFlipper() {
  auto generatingCSR = flipperState_->start("Generate CSR");
  std::string csr = contextStore_->getCertificateSigningRequest();
  generatingCSR->complete();
  int medium = certProvider_ != nullptr
      ? certProvider_->getCertificateExchangeMedium()
      : FlipperCertificateExchangeMedium::FS_ACCESS;
  folly::dynamic message =
      folly::dynamic::object("method", "signCertificate")("csr", csr.c_str())(
          "destination", contextStore_->getCertificateDirectoryPath().c_str())(
          "medium", medium);
  auto gettingCert = flipperState_->start("Getting cert from desktop");

  flipperEventBase_->add([this, message, gettingCert]() {
    client_->getRequester()
        ->requestResponse(rsocket::Payload(folly::toJson(message)))
        ->subscribe(
            [this, gettingCert](rsocket::Payload p) {
              auto response = p.moveDataToString();
              if (!response.empty()) {
                folly::dynamic config = folly::parseJson(response);
                contextStore_->storeConnectionConfig(config);
              }
              if (certProvider_) {
                certProvider_->setFlipperState(flipperState_);
                auto gettingCertFromProvider =
                    flipperState_->start("Getting cert from Cert Provider");

                try {
                  // Certificates should be present in app's sandbox after it is
                  // returned. The reason we can't have a completion block here
                  // is because if the certs are not present after it returns
                  // then the flipper tries to reconnect on insecured channel
                  // and recreates the app.csr. By the time completion block is
                  // called the DeviceCA cert doesn't match app's csr and it
                  // throws an SSL error.
                  certProvider_->getCertificates(
                      contextStore_->getCertificateDirectoryPath(),
                      contextStore_->getDeviceId());
                  gettingCertFromProvider->complete();
                } catch (std::exception& e) {
                  gettingCertFromProvider->fail(e.what());
                  gettingCert->fail(e.what());
                } catch (...) {
                  gettingCertFromProvider->fail("Exception from certProvider");
                  gettingCert->fail("Exception from certProvider");
                }
              }
              log("Certificate exchange complete.");
              gettingCert->complete();

              // Disconnect after message sending is complete.
              // This will trigger a reconnect which should use the secure
              // channel.
              // TODO: Connect immediately, without waiting for reconnect
              client_ = nullptr;
            },
            [this, message, gettingCert](folly::exception_wrapper e) {
              e.handle(
                  [&](rsocket::ErrorWithPayload& errorWithPayload) {
                    std::string errorMessage =
                        errorWithPayload.payload.moveDataToString();

                    if (errorMessage.compare("not implemented")) {
                      auto error =
                          "Desktop failed to provide certificates. Error from flipper desktop:\n" +
                          errorMessage;
                      log(error);
                      gettingCert->fail(error);
                      client_ = nullptr;
                    } else {
                      sendLegacyCertificateRequest(message);
                    }
                  },
                  [e, gettingCert](...) {
                    gettingCert->fail(e.what().c_str());
                  });
            });
  });
  failedConnectionAttempts_ = 0;
}

void FlipperConnectionManagerImpl::sendLegacyCertificateRequest(
    folly::dynamic message) {
  // Desktop is using an old version of Flipper.
  // Fall back to fireAndForget, instead of requestResponse.
  auto sendingRequest =
      flipperState_->start("Sending fallback certificate request");
  client_->getRequester()
      ->fireAndForget(rsocket::Payload(folly::toJson(message)))
      ->subscribe([this, sendingRequest]() {
        sendingRequest->complete();
        folly::dynamic config = folly::dynamic::object();
        contextStore_->storeConnectionConfig(config);
        client_ = nullptr;
      });
}

bool FlipperConnectionManagerImpl::isRunningInOwnThread() {
  return flipperEventBase_->isInEventBaseThread();
}

rsocket::Payload toRSocketPayload(dynamic data) {
  std::string json = folly::toJson(data);
  rsocket::Payload payload = rsocket::Payload(json);
  auto payloadLength = payload.data->computeChainDataLength();
  if (payloadLength > maxPayloadSize) {
    auto logMessage =
        std::string(
            "Error: Skipping sending message larger than max rsocket payload: ") +
        json.substr(0, 100) + "...";
    log(logMessage);
    throw std::length_error(logMessage);
  }

  return payload;
}

} // namespace flipper
} // namespace facebook
