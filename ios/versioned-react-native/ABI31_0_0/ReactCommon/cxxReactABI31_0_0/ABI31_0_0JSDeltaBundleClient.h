// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <cstdint>
#include <memory>
#include <string>
#include <unordered_map>

#include <cxxReactABI31_0_0/ABI31_0_0JSBigString.h>
#include <cxxReactABI31_0_0/ABI31_0_0JSModulesUnbundle.h>
#include <folly/dynamic.h>

namespace facebook {
namespace ReactABI31_0_0 {

class JSDeltaBundleClient {
public:
  void patch(const folly::dynamic& delta);
  JSModulesUnbundle::Module getModule(uint32_t moduleId) const;
  std::unique_ptr<const JSBigString> getStartupCode() const;
  void clear();

private:
  std::unordered_map<uint32_t, std::string> modules_;
  std::string startupCode_;
};

class JSDeltaBundleClientRAMBundle : public JSModulesUnbundle {
public:
  JSDeltaBundleClientRAMBundle(
    std::shared_ptr<const JSDeltaBundleClient> client) : client_(client) {}

  Module getModule(uint32_t moduleId) const override {
    return client_->getModule(moduleId);
  }
private:
  const std::shared_ptr<const JSDeltaBundleClient> client_;
};

} // namespace ReactABI31_0_0
} // namespace facebook
