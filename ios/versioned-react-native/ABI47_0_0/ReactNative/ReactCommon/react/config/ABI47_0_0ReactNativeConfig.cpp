/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0ReactNativeConfig.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/**
 * ABI47_0_0ReactNative configuration as provided by the hosting app.
 * Provide a sub-class implementation to allow app specific customization.
 */
ABI47_0_0ReactNativeConfig::ABI47_0_0ReactNativeConfig() {}

ABI47_0_0ReactNativeConfig::~ABI47_0_0ReactNativeConfig() {}

EmptyABI47_0_0ReactNativeConfig::EmptyABI47_0_0ReactNativeConfig() {}

bool EmptyABI47_0_0ReactNativeConfig::getBool(const std::string &param) const {
  return false;
}

std::string EmptyABI47_0_0ReactNativeConfig::getString(const std::string &param) const {
  return "";
}

int64_t EmptyABI47_0_0ReactNativeConfig::getInt64(const std::string &param) const {
  return 0;
}

double EmptyABI47_0_0ReactNativeConfig::getDouble(const std::string &param) const {
  return 0.0;
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
