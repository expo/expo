/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>
#include <ABI47_0_0React/ABI47_0_0renderer/runtimescheduler/RuntimeSchedulerClock.h>
#include <ABI47_0_0React/ABI47_0_0renderer/runtimescheduler/SchedulerPriority.h>

#include <optional>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

class RuntimeScheduler;
class TaskPriorityComparer;

struct Task final {
  Task(
      SchedulerPriority priority,
      jsi::Function callback,
      std::chrono::steady_clock::time_point expirationTime);

 private:
  friend RuntimeScheduler;
  friend TaskPriorityComparer;

  SchedulerPriority priority;
  std::optional<jsi::Function> callback;
  RuntimeSchedulerClock::time_point expirationTime;

  jsi::Value execute(jsi::Runtime &runtime);
};

class TaskPriorityComparer {
 public:
  inline bool operator()(
      std::shared_ptr<Task> const &lhs,
      std::shared_ptr<Task> const &rhs) {
    return lhs->expirationTime > rhs->expirationTime;
  }
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
