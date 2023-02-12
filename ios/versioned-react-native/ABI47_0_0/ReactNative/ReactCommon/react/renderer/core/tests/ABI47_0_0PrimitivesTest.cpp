/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <exception>

#include <gtest/gtest.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/Sealable.h>

using namespace ABI47_0_0facebook::ABI47_0_0React;

TEST(SealableTest, sealObjectCorrectly) {
  Sealable obj;
  ABI47_0_0EXPECT_FALSE(obj.getSealed());

  obj.seal();
  ABI47_0_0EXPECT_TRUE(obj.getSealed());
}

TEST(SealableTest, handleAssignmentsCorrectly) {
  Sealable obj;
  Sealable other;

  // Should work fine.
  obj = other;

  // Assignment after getting sealed is not allowed.
  obj.seal();
  Sealable other2;

  ABI47_0_0EXPECT_DEATH_IF_SUPPORTED(
      { obj = other2; }, "Attempt to mutate a sealed object.");

  // It doesn't matter if the other object is also sealed, it's still not
  // allowed.
  other2.seal();
  ABI47_0_0EXPECT_DEATH_IF_SUPPORTED(
      { obj = other2; }, "Attempt to mutate a sealed object.");

  // Fresh creation off other Sealable is still unsealed.
  Sealable other3(obj);
  ABI47_0_0EXPECT_FALSE(other3.getSealed());
}
