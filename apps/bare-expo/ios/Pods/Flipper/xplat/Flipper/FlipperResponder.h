/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/json.h>

namespace facebook {
namespace flipper {

/**
 * FlipperResponder is used to asynchronously respond to messages
 * received from the Flipper desktop app.
 */
class FlipperResponder {
 public:
  virtual ~FlipperResponder(){};

  /**
   * Deliver a successful response to the Flipper desktop app.
   */
  virtual void success(const folly::dynamic& response) = 0;

  /**
   * Inform the Flipper desktop app of an error in handling the request.
   */
  virtual void error(const folly::dynamic& response) = 0;
};

} // namespace flipper
} // namespace facebook
