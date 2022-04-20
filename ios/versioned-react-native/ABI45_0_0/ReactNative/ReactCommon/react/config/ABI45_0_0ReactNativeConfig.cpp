/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI45_0_0ReactNativeConfig.h"

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

/**
 * ABI45_0_0ReactNative configuration as provided by the hosting app.
 * Provide a sub-class implementation to allow app specific customization.
 */
ABI45_0_0ReactNativeConfig::ABI45_0_0ReactNativeConfig() {}

ABI45_0_0ReactNativeConfig::~ABI45_0_0ReactNativeConfig() {}

EmptyABI45_0_0ReactNativeConfig::EmptyABI45_0_0ReactNativeConfig() {}

bool EmptyABI45_0_0ReactNativeConfig::getBool(const std::string &param) const {
  return false;
}

std::string EmptyABI45_0_0ReactNativeConfig::getString(const std::string &param) const {
  return "";
}

int64_t EmptyABI45_0_0ReactNativeConfig::getInt64(const std::string &param) const {
  return 0;
}

double EmptyABI45_0_0ReactNativeConfig::getDouble(const std::string &param) const {
  return 0.0;
}

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
