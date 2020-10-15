/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Executor.h>
#include <folly/io/async/EventBase.h>
#include <rsocket/RSocket.h>
#include <mutex>
#include "FlipperConnectionManager.h"
#include "FlipperInitConfig.h"
#include "FlipperState.h"

namespace facebook {
namespace flipper {

class ConnectionEvents;
class ConnectionContextStore;
class FlipperRSocketResponder;

rsocket::Payload toRSocketPayload(folly::dynamic data);

class FlipperConnectionManagerImpl : public FlipperConnectionManager {
  friend ConnectionEvents;

 public:
  FlipperConnectionManagerImpl(
      FlipperInitConfig config,
      std::shared_ptr<FlipperState> state,
      std::shared_ptr<ConnectionContextStore> contextStore);

  ~FlipperConnectionManagerImpl();

  void start() override;

  void stop() override;

  bool isOpen() const override;

  void setCallbacks(Callbacks* callbacks) override;

  void sendMessage(const folly::dynamic& message) override;

  void onMessageReceived(
      const folly::dynamic& message,
      std::unique_ptr<FlipperResponder> responder) override;

  void reconnect();
  void setCertificateProvider(
      const std::shared_ptr<FlipperCertificateProvider> provider) override;
  std::shared_ptr<FlipperCertificateProvider> getCertificateProvider() override;

 private:
  bool isOpen_ = false;
  bool isStarted_ = false;
  std::shared_ptr<FlipperCertificateProvider> certProvider_ = nullptr;
  Callbacks* callbacks_;
  DeviceData deviceData_;
  std::shared_ptr<FlipperState> flipperState_;
  int insecurePort;
  int securePort;

  folly::EventBase* flipperEventBase_;
  folly::EventBase* connectionEventBase_;
  std::unique_ptr<rsocket::RSocketClient> client_;
  bool connectionIsTrusted_;
  int failedConnectionAttempts_ = 0;
  std::shared_ptr<ConnectionContextStore> contextStore_;

  void startSync();
  bool doCertificateExchange();
  bool connectSecurely();
  bool isCertificateExchangeNeeded();
  void requestSignedCertFromFlipper();
  bool isRunningInOwnThread();
  void sendLegacyCertificateRequest(folly::dynamic message);
  std::string getDeviceId();
};

} // namespace flipper
} // namespace facebook
