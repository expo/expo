/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/json.h>
#include <functional>
#include <string>
#include "FlipperResponder.h"

namespace facebook {
namespace flipper {

/**
Represents a connection between the Desktop and mobile plugins
with corresponding identifiers.
*/
class FlipperConnection {
 public:
  using FlipperReceiver = std::function<
      void(const folly::dynamic&, std::shared_ptr<FlipperResponder>)>;

  virtual ~FlipperConnection() {}

  /**
  Invoke a method on the Flipper desktop plugin with with a matching identifier.
  */
  virtual void send(
      const std::string& method,
      const folly::dynamic& params) = 0;

  /**
  Report an error to the Flipper desktop app
  */
  virtual void error(
      const std::string& message,
      const std::string& stacktrace) = 0;

  /**
  Register a receiver to be notified of incoming calls of the given
  method from the Flipper desktop plugin with a matching identifier.
  */
  virtual void receive(
      const std::string& method,
      const FlipperReceiver& receiver) = 0;
};

} // namespace flipper
} // namespace facebook
