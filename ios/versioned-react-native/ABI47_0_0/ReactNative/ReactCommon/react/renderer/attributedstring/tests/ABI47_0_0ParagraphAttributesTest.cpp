/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <ABI47_0_0React/ABI47_0_0renderer/attributedstring/ParagraphAttributes.h>
#include <ABI47_0_0React/ABI47_0_0renderer/attributedstring/conversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/attributedstring/primitives.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

#ifdef ANDROID

TEST(ParagraphAttributesTest, testToDynamic) {
  auto paragraphAttributes = ParagraphAttributes{};
  paragraphAttributes.maximumNumberOfLines = 2;
  paragraphAttributes.adjustsFontSizeToFit = false;
  paragraphAttributes.ellipsizeMode = EllipsizeMode::Middle;

  auto result = toDynamic(paragraphAttributes);
  ABI47_0_0EXPECT_EQ(
      result["maximumNumberOfLines"], paragraphAttributes.maximumNumberOfLines);
  ABI47_0_0EXPECT_EQ(
      result["adjustsFontSizeToFit"], paragraphAttributes.adjustsFontSizeToFit);
  ABI47_0_0EXPECT_EQ(
      result["ellipsizeMode"], toString(paragraphAttributes.ellipsizeMode));
}

#endif

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
