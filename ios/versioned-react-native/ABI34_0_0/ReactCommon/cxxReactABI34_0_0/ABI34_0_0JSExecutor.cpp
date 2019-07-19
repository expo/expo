// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "ABI34_0_0JSExecutor.h"

#include "ABI34_0_0RAMBundleRegistry.h"

#include <folly/Conv.h>

namespace facebook {
namespace ReactABI34_0_0 {

std::string JSExecutor::getSyntheticBundlePath(
    uint32_t bundleId,
    const std::string& bundlePath) {
  if (bundleId == RAMBundleRegistry::MAIN_BUNDLE_ID) {
    return bundlePath;
  }
  return folly::to<std::string>("seg-", bundleId, ".js");
}

}
}
