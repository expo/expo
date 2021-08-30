/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <exception>

#include <gtest/gtest.h>
#include <ABI41_0_0React/core/Sealable.h>

using namespace ABI41_0_0facebook::ABI41_0_0React;

TEST(SealableTest, sealObjectCorrectly) {
  Sealable obj;
  ABI41_0_0EXPECT_FALSE(obj.getSealed());

  obj.seal();
  ABI41_0_0EXPECT_TRUE(obj.getSealed());
}

TEST(SealableTest, handleAssignmentsCorrectly) {
  Sealable obj;
  Sealable other;
  ABI41_0_0EXPECT_NO_THROW(obj = other);

  // Assignment after getting sealed is not allowed.
  obj.seal();
  Sealable other2;
  ABI41_0_0EXPECT_THROW(obj = other2, std::runtime_error);

  // It doesn't matter if the other object is also sealed, it's still not
  // allowed.
  other2.seal();
  ABI41_0_0EXPECT_THROW(obj = other2, std::runtime_error);

  // Fresh creation off other Sealable is still unsealed.
  Sealable other3(obj);
  ABI41_0_0EXPECT_FALSE(other3.getSealed());
}
