/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0ReactCommon/ABI49_0_0SchedulerPriority.h>
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeSchedulerClock.h>

#include <optional>
#include <variant>

namespace ABI49_0_0facebook::ABI49_0_0React {

class RuntimeScheduler;
class TaskPriorityComparer;

using RawCallback = std::function<void(jsi::Runtime &)>;

struct Task final : public jsi::NativeState {
  Task(
      SchedulerPriority priority,
      jsi::Function callback,
      std::chrono::steady_clock::time_point expirationTime);

  Task(
      SchedulerPriority priority,
      RawCallback callback,
      std::chrono::steady_clock::time_point expirationTime);

 private:
  friend RuntimeScheduler;
  friend TaskPriorityComparer;

  SchedulerPriority priority;
  std::optional<std::variant<jsi::Function, RawCallback>> callback;
  RuntimeSchedulerClock::time_point expirationTime;

  jsi::Value execute(jsi::Runtime &runtime, bool didUserCallbackTimeout);
};

class TaskPriorityComparer {
 public:
  inline bool operator()(
      std::shared_ptr<Task> const &lhs,
      std::shared_ptr<Task> const &rhs) {
    return lhs->expirationTime > rhs->expirationTime;
  }
};

} // namespace ABI49_0_0facebook::ABI49_0_0React
