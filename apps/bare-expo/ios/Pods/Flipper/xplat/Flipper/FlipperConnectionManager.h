/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/json.h>
#include "FlipperCertificateProvider.h"
#include "FlipperResponder.h"

namespace facebook {
namespace flipper {

class FlipperConnectionManager {
 public:
  class Callbacks;

 public:
  virtual ~FlipperConnectionManager(){};

  /**
   Establishes a connection to the ws server.
   */
  virtual void start() = 0;

  /**
   Closes an open connection to the ws server.
   */
  virtual void stop() = 0;

  /**
   Sets the Auth token to be used for hitting an Intern end point
   */
  virtual void setCertificateProvider(
      const std::shared_ptr<FlipperCertificateProvider> provider) = 0;

  /**
   Gets the certificate provider
   */
  virtual std::shared_ptr<FlipperCertificateProvider>
  getCertificateProvider() = 0;

  /**
   True if there's an open connection.
   This method may block if the connection is busy.
   */
  virtual bool isOpen() const = 0;

  /**
   Send message to the ws server.
   */
  virtual void sendMessage(const folly::dynamic& message) = 0;

  /**
   Handler for connection and message receipt from the ws server.
   The callbacks should be set before a connection is established.
   */
  virtual void setCallbacks(Callbacks* callbacks) = 0;

  /**
   Called by ws server when a message has been received.
  */
  virtual void onMessageReceived(
      const folly::dynamic& message,
      std::unique_ptr<FlipperResponder> responder) = 0;
};

class FlipperConnectionManager::Callbacks {
 public:
  virtual ~Callbacks(){};

  virtual void onConnected() = 0;

  virtual void onDisconnected() = 0;

  virtual void onMessageReceived(
      const folly::dynamic& message,
      std::unique_ptr<FlipperResponder>) = 0;
};

} // namespace flipper
} // namespace facebook
