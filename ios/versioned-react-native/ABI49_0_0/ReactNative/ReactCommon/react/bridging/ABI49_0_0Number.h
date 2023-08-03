/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/bridging/ABI49_0_0Base.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

template <>
struct Bridging<double> {
  static double fromJs(jsi::Runtime &, const jsi::Value &value) {
    return value.asNumber();
  }

  static jsi::Value toJs(jsi::Runtime &, double value) {
    return value;
  }
};

template <>
struct Bridging<float> {
  static float fromJs(jsi::Runtime &, const jsi::Value &value) {
    return (float)value.asNumber();
  }

  static jsi::Value toJs(jsi::Runtime &, float value) {
    return (double)value;
  }
};

template <>
struct Bridging<int32_t> {
  static int32_t fromJs(jsi::Runtime &, const jsi::Value &value) {
    return (int32_t)value.asNumber();
  }

  static jsi::Value toJs(jsi::Runtime &, int32_t value) {
    return value;
  }
};

template <>
struct Bridging<uint32_t> {
  static uint32_t fromJs(jsi::Runtime &, const jsi::Value &value) {
    return (uint32_t)value.asNumber();
  }

  static jsi::Value toJs(jsi::Runtime &, uint32_t value) {
    return (double)value;
  }
};

} // namespace ABI49_0_0facebook::ABI49_0_0React
