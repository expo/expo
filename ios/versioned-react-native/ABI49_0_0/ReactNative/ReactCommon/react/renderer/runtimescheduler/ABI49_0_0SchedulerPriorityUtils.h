/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0ReactCommon/ABI49_0_0SchedulerPriority.h>
#include <ABI49_0_0React/debug/ABI49_0_0React_native_assert.h>
#include <chrono>

namespace ABI49_0_0facebook::ABI49_0_0React {

static constexpr std::underlying_type<SchedulerPriority>::type serialize(
    SchedulerPriority schedulerPriority) {
  return static_cast<std::underlying_type<SchedulerPriority>::type>(
      schedulerPriority);
}

static inline SchedulerPriority fromRawValue(double value) {
  switch ((int)value) {
    case 1:
      return SchedulerPriority::ImmediatePriority;
    case 2:
      return SchedulerPriority::UserBlockingPriority;
    case 3:
      return SchedulerPriority::NormalPriority;
    case 4:
      return SchedulerPriority::LowPriority;
    case 5:
      return SchedulerPriority::IdlePriority;
    default:
      ABI49_0_0React_native_assert(false && "Unsupported SchedulerPriority value");
      return SchedulerPriority::NormalPriority;
  }
}

static inline std::chrono::milliseconds timeoutForSchedulerPriority(
    SchedulerPriority schedulerPriority) {
  switch (schedulerPriority) {
    case SchedulerPriority::ImmediatePriority:
      return std::chrono::milliseconds(-1);
    case SchedulerPriority::UserBlockingPriority:
      return std::chrono::milliseconds(250);
    case SchedulerPriority::NormalPriority:
      return std::chrono::milliseconds(5000);
    case SchedulerPriority::LowPriority:
      return std::chrono::milliseconds(10'000);
    case SchedulerPriority::IdlePriority:
      return std::chrono::milliseconds::max();
  }
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
