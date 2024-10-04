/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <ABI42_0_0cxxreact/ABI42_0_0CxxModule.h>

namespace ABI42_0_0facebook {
namespace xplat {
namespace module {

// Allows a Cxx-module to be shared or reused across multiple ABI42_0_0React instances
// Caveat: the setInstance call is not forwarded, so usages of getInstance
// inside your module (e.g. dispatching events) will always be nullptr.
class SharedProxyCxxModule : public CxxModule {
 public:
  explicit SharedProxyCxxModule(std::shared_ptr<CxxModule> shared)
      : shared_(shared) {}

  std::string getName() override {
    return shared_->getName();
  }

  auto getConstants() -> std::map<std::string, folly::dynamic> override {
    return shared_->getConstants();
  }

  auto getMethods() -> std::vector<Method> override {
    return shared_->getMethods();
  }

 private:
  std::shared_ptr<CxxModule> shared_;
};

} // namespace module
} // namespace xplat
} // namespace ABI42_0_0facebook
