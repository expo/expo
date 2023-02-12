/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0ReactNativeConfig.h"

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/**
 * ABI48_0_0ReactNative configuration as provided by the hosting app.
 * Provide a sub-class implementation to allow app specific customization.
 */
ABI48_0_0ReactNativeConfig::ABI48_0_0ReactNativeConfig() {}

ABI48_0_0ReactNativeConfig::~ABI48_0_0ReactNativeConfig() {}

EmptyABI48_0_0ReactNativeConfig::EmptyABI48_0_0ReactNativeConfig() {}

bool EmptyABI48_0_0ReactNativeConfig::getBool(const std::string &param) const {
  return false;
}

std::string EmptyABI48_0_0ReactNativeConfig::getString(const std::string &param) const {
  return "";
}

int64_t EmptyABI48_0_0ReactNativeConfig::getInt64(const std::string &param) const {
  return 0;
}

double EmptyABI48_0_0ReactNativeConfig::getDouble(const std::string &param) const {
  return 0.0;
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
