/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>
#include <ABI47_0_0React/ABI47_0_0renderer/runtimescheduler/RuntimeScheduler.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Exposes RuntimeScheduler to JavaScript realm.
 */
class RuntimeSchedulerBinding : public jsi::HostObject {
 public:
  RuntimeSchedulerBinding(std::shared_ptr<RuntimeScheduler> runtimeScheduler);

  /*
   * Installs RuntimeSchedulerBinding into JavaScript runtime if needed.
   * Creates and sets `RuntimeSchedulerBinding` into the global namespace.
   * In case if the global namespace already has a `RuntimeSchedulerBinding`
   * installed, returns that.
   */
  static std::shared_ptr<RuntimeSchedulerBinding> createAndInstallIfNeeded(
      jsi::Runtime &runtime,
      std::shared_ptr<RuntimeScheduler> const &runtimeScheduler);

  /*
   * Returns a shared pointer to RuntimeSchedulerBinding previously installed
   * into a runtime. Thread synchronization must be enforced externally.
   */
  static std::shared_ptr<RuntimeSchedulerBinding> getBinding(
      jsi::Runtime &runtime);

  /*
   * `jsi::HostObject` specific overloads.
   */
  jsi::Value get(jsi::Runtime &runtime, jsi::PropNameID const &name) override;

  bool getIsSynchronous() const;

 private:
  std::shared_ptr<RuntimeScheduler> runtimeScheduler_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
