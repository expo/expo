/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0RuntimeScheduler.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

Task::Task(
    SchedulerPriority priority,
    jsi::Function callback,
    std::chrono::steady_clock::time_point expirationTime)
    : priority(priority),
      callback(std::move(callback)),
      expirationTime(expirationTime) {}

jsi::Value Task::execute(jsi::Runtime &runtime) {
  auto result = jsi::Value::undefined();
  // Cancelled task doesn't have a callback.
  if (callback) {
    // Callback in JavaScript is expecting a single bool parameter.
    // ABI47_0_0React team plans to remove it and it is safe to pass in
    // hardcoded false value.
    result = callback.value().call(runtime, {false});

    // Destroying callback to prevent calling it twice.
    callback.reset();
  }
  return result;
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
