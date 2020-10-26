/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <map>
#include <string>
#include "FlipperConnection.h"
#include "FlipperConnectionManager.h"
#include "Log.h"

namespace facebook {
namespace flipper {

class FlipperConnectionImpl : public FlipperConnection {
 public:
  FlipperConnectionImpl(
      FlipperConnectionManager* socket,
      const std::string& name)
      : socket_(socket), name_(name) {}

  void call(
      const std::string& method,
      const folly::dynamic& params,
      std::shared_ptr<FlipperResponder> responder) {
    if (receivers_.find(method) == receivers_.end()) {
      std::string errorMessage = "Receiver " + method + " not found.";
      log("Error: " + errorMessage);
      responder->error(folly::dynamic::object("message", errorMessage));
      return;
    }
    receivers_.at(method)(params, responder);
  }

  void send(const std::string& method, const folly::dynamic& params) override {
    folly::dynamic message = folly::dynamic::object("method", "execute")(
        "params",
        folly::dynamic::object("api", name_)("method", method)(
            "params", params));
    socket_->sendMessage(message);
  }

  void error(const std::string& message, const std::string& stacktrace)
      override {
    socket_->sendMessage(folly::dynamic::object(
        "error",
        folly::dynamic::object("message", message)("stacktrace", stacktrace)));
  }

  void receive(const std::string& method, const FlipperReceiver& receiver)
      override {
    receivers_[method] = receiver;
  }

  /**
  Runtime check which receivers are supported for this app
  */
  bool hasReceiver(const std::string& method) {
    return receivers_.find(method) != receivers_.end();
  }

 private:
  FlipperConnectionManager* socket_;
  std::string name_;
  std::map<std::string, FlipperReceiver> receivers_;
};

} // namespace flipper
} // namespace facebook
