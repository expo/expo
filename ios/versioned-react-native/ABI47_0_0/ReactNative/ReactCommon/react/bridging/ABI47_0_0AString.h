/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/bridging/ABI47_0_0Base.h>

#include <string>
#include <string_view>

namespace ABI47_0_0facebook::ABI47_0_0React {

template <>
struct Bridging<std::string> {
  static std::string fromJs(jsi::Runtime &rt, const jsi::String &value) {
    return value.utf8(rt);
  }

  static jsi::String toJs(jsi::Runtime &rt, const std::string &value) {
    return jsi::String::createFromUtf8(rt, value);
  }
};

template <>
struct Bridging<std::string_view> {
  static jsi::String toJs(jsi::Runtime &rt, std::string_view value) {
    return jsi::String::createFromUtf8(
        rt, reinterpret_cast<const uint8_t *>(value.data()), value.length());
  }
};

template <>
struct Bridging<const char *> : Bridging<std::string_view> {};

template <size_t N>
struct Bridging<char[N]> : Bridging<std::string_view> {};

} // namespace ABI47_0_0facebook::ABI47_0_0React
