/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0ParagraphAttributes.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0conversions.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0primitives.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

#ifdef ANDROID

TEST(ParagraphAttributesTest, testToDynamic) {
  auto paragraphAttributes = ParagraphAttributes{};
  paragraphAttributes.maximumNumberOfLines = 2;
  paragraphAttributes.adjustsFontSizeToFit = false;
  paragraphAttributes.ellipsizeMode = EllipsizeMode::Middle;

  auto result = toDynamic(paragraphAttributes);
  ABI49_0_0EXPECT_EQ(
      result["maximumNumberOfLines"], paragraphAttributes.maximumNumberOfLines);
  ABI49_0_0EXPECT_EQ(
      result["adjustsFontSizeToFit"], paragraphAttributes.adjustsFontSizeToFit);
  ABI49_0_0EXPECT_EQ(
      result["ellipsizeMode"], toString(paragraphAttributes.ellipsizeMode));
}

#endif

} // namespace ABI49_0_0facebook::ABI49_0_0React
