/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0JSExecutor.h"

#include "ABI47_0_0RAMBundleRegistry.h"

#include <folly/Conv.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

std::string JSExecutor::getSyntheticBundlePath(
    uint32_t bundleId,
    const std::string &bundlePath) {
  if (bundleId == RAMBundleRegistry::MAIN_BUNDLE_ID) {
    return bundlePath;
  }
  return folly::to<std::string>("seg-", bundleId, ".js");
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
