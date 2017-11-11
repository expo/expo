// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cxxReactABI23_0_0/ABI23_0_0RAMBundleRegistry.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook {
namespace ReactABI23_0_0 {

class RN_EXPORT JSIndexedRAMBundleRegistry: public RAMBundleRegistry {
public:
  JSIndexedRAMBundleRegistry(std::unique_ptr<JSModulesUnbundle> mainBundle, const std::string& entryFile);

protected:
  virtual std::unique_ptr<JSModulesUnbundle> bundleById(uint32_t index) const override;
private:
  std::string m_baseDirectoryPath;
};

}  // namespace ReactABI23_0_0
}  // namespace facebook
