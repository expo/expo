/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0ReactNativeConfig.h"

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/**
 * ABI43_0_0ReactNative configuration as provided by the hosting app.
 * Provide a sub-class implementation to allow app specific customization.
 */
ABI43_0_0ReactNativeConfig::ABI43_0_0ReactNativeConfig() {}

ABI43_0_0ReactNativeConfig::~ABI43_0_0ReactNativeConfig() {}

EmptyABI43_0_0ReactNativeConfig::EmptyABI43_0_0ReactNativeConfig() {}

bool EmptyABI43_0_0ReactNativeConfig::getBool(const std::string &param) const {
  return false;
}

std::string EmptyABI43_0_0ReactNativeConfig::getString(const std::string &param) const {
  return "";
}

int64_t EmptyABI43_0_0ReactNativeConfig::getInt64(const std::string &param) const {
  return 0;
}

double EmptyABI43_0_0ReactNativeConfig::getDouble(const std::string &param) const {
  return 0.0;
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
