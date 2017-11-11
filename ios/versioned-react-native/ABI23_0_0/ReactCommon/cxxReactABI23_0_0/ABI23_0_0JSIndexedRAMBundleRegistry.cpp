// Copyright 2004-present Facebook. All Rights Reserved.

#include "ABI23_0_0JSIndexedRAMBundleRegistry.h"

#include <cxxReactABI23_0_0/ABI23_0_0JSIndexedRAMBundle.h>
#include <folly/Memory.h>

#include "ABI23_0_0oss-compat-util.h"

namespace facebook {
namespace ReactABI23_0_0 {

JSIndexedRAMBundleRegistry::JSIndexedRAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle, const std::string& entryFile):
    RAMBundleRegistry(std::move(mainBundle)), m_baseDirectoryPath(jsBundlesDir(entryFile)) {}

std::unique_ptr<JSModulesUnbundle> JSIndexedRAMBundleRegistry::bundleById(uint32_t index) const {
  std::string bundlePathById = m_baseDirectoryPath + toString(index) + ".jsbundle";
  return folly::make_unique<JSIndexedRAMBundle>(bundlePathById.c_str());
}

}  // namespace ReactABI23_0_0
}  // namespace facebook
