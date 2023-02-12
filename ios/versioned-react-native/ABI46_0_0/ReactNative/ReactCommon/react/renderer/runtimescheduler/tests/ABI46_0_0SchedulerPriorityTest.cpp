/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <ABI46_0_0React/ABI46_0_0renderer/runtimescheduler/Task.h>
#include <chrono>

using namespace ABI46_0_0facebook::ABI46_0_0React;

TEST(SchedulerPriorityTest, fromRawValue) {
  ABI46_0_0EXPECT_EQ(SchedulerPriority::ImmediatePriority, fromRawValue(1.0));
  ABI46_0_0EXPECT_EQ(SchedulerPriority::UserBlockingPriority, fromRawValue(2.0));
  ABI46_0_0EXPECT_EQ(SchedulerPriority::NormalPriority, fromRawValue(3.0));
  ABI46_0_0EXPECT_EQ(SchedulerPriority::LowPriority, fromRawValue(4.0));
  ABI46_0_0EXPECT_EQ(SchedulerPriority::IdlePriority, fromRawValue(5.0));
}

TEST(SchedulerPriorityTest, serialize) {
  ABI46_0_0EXPECT_EQ(serialize(SchedulerPriority::ImmediatePriority), 1);
  ABI46_0_0EXPECT_EQ(serialize(SchedulerPriority::UserBlockingPriority), 2);
  ABI46_0_0EXPECT_EQ(serialize(SchedulerPriority::NormalPriority), 3);
  ABI46_0_0EXPECT_EQ(serialize(SchedulerPriority::LowPriority), 4);
  ABI46_0_0EXPECT_EQ(serialize(SchedulerPriority::IdlePriority), 5);
}

TEST(SchedulerPriorityTest, timeoutForSchedulerPriority) {
  ABI46_0_0EXPECT_EQ(
      timeoutForSchedulerPriority(SchedulerPriority::ImmediatePriority),
      std::chrono::milliseconds(-1));
  ABI46_0_0EXPECT_EQ(
      timeoutForSchedulerPriority(SchedulerPriority::UserBlockingPriority),
      std::chrono::milliseconds(250));
  ABI46_0_0EXPECT_EQ(
      timeoutForSchedulerPriority(SchedulerPriority::NormalPriority),
      std::chrono::seconds(5));
  ABI46_0_0EXPECT_EQ(
      timeoutForSchedulerPriority(SchedulerPriority::LowPriority),
      std::chrono::seconds(10));
  ABI46_0_0EXPECT_EQ(
      timeoutForSchedulerPriority(SchedulerPriority::IdlePriority),
      std::chrono::milliseconds::max());
}
