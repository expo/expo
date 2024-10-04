/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/bridging/ABI47_0_0Base.h>

namespace ABI47_0_0facebook::ABI47_0_0React {

class Error {
 public:
  // TODO (T114055466): Retain stack trace (at least caller location)
  Error(std::string message) : message_(std::move(message)) {}

  Error(const char *message) : Error(std::string(message)) {}

  const std::string &message() const {
    return message_;
  }

 private:
  std::string message_;
};

template <>
struct Bridging<jsi::JSError> {
  static jsi::JSError fromJs(jsi::Runtime &rt, const jsi::Value &value) {
    return jsi::JSError(rt, jsi::Value(rt, value));
  }

  static jsi::JSError fromJs(jsi::Runtime &rt, jsi::Value &&value) {
    return jsi::JSError(rt, std::move(value));
  }

  static jsi::Value toJs(jsi::Runtime &rt, std::string message) {
    return jsi::Value(rt, jsi::JSError(rt, std::move(message)).value());
  }
};

template <>
struct Bridging<Error> {
  static jsi::Value toJs(jsi::Runtime &rt, const Error &error) {
    return jsi::Value(rt, jsi::JSError(rt, error.message()).value());
  }
};

} // namespace ABI47_0_0facebook::ABI47_0_0React
