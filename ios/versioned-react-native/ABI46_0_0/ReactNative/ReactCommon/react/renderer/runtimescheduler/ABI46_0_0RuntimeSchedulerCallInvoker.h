/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI46_0_0ReactCommon/ABI46_0_0CallInvoker.h>
#include <ABI46_0_0React/ABI46_0_0renderer/runtimescheduler/RuntimeScheduler.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

/*
 * Exposes RuntimeScheduler to native modules. All calls invonked on JavaScript
 * queue from native modules will be funneled through RuntimeScheduler.
 */
class RuntimeSchedulerCallInvoker : public CallInvoker {
 public:
  RuntimeSchedulerCallInvoker(std::weak_ptr<RuntimeScheduler> runtimeScheduler);

  void invokeAsync(std::function<void()> &&func) override;
  void invokeSync(std::function<void()> &&func) override;

 private:
  /*
   * RuntimeScheduler is retained by the runtime. It must not be
   * retained by anything beyond the runtime.
   */
  std::weak_ptr<RuntimeScheduler> runtimeScheduler_;
};

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
