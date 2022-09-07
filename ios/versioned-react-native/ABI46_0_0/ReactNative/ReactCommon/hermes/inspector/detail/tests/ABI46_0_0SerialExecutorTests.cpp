/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI46_0_0hermes/ABI46_0_0inspector/detail/SerialExecutor.h>

#include <array>
#include <iostream>

#include <gtest/gtest.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0hermes {
namespace inspector {
namespace detail {

TEST(SerialExecutorTests, testProcessesItems) {
  std::array<int, 1024> values{};

  {
    SerialExecutor executor("TestExecutor");

    for (int i = 0; i < values.size(); i++) {
      executor.add([=, &values]() { values[i] = i; });
    }
  }

  // By this time the serial executor destructor should have exited and waited
  // for all work items to complete.
  for (int i = 0; i < values.size(); i++) {
    ABI46_0_0EXPECT_EQ(values[i], i);
  }
}

} // namespace detail
} // namespace inspector
} // namespace ABI46_0_0hermes
} // namespace ABI46_0_0facebook
