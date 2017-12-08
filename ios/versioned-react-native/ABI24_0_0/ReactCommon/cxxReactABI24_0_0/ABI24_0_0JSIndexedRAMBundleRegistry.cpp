// Copyright 2004-present Facebook. All Rights Reserved.

#include "ABI24_0_0JSIndexedRAMBundleRegistry.h"

#include <cxxReactABI24_0_0/ABI24_0_0JSIndexedRAMBundle.h>
#include <folly/Memory.h>

#include "ABI24_0_0oss-compat-util.h"

namespace facebook {
namespace ReactABI24_0_0 {

JSIndexedRAMBundleRegistry::JSIndexedRAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle, const std::string& baseDirectoryPath):
RAMBundleRegistry(std::move(mainBundle)), m_baseDirectoryPath(baseDirectoryPath) {}

std::unique_ptr<JSModulesUnbundle> JSIndexedRAMBundleRegistry::bundleById(uint32_t index) const {
  std::string bundlePathById = m_baseDirectoryPath + toString(index) + ".jsbundle";
  return folly::make_unique<JSIndexedRAMBundle>(bundlePathById.c_str());
}

}  // namespace ReactABI24_0_0
}  // namespace facebook
