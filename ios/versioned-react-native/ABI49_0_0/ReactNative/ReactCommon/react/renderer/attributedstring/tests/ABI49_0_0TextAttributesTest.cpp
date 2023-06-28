/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0TextAttributes.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0conversions.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0primitives.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0graphicsConversions.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

#ifdef ANDROID

TEST(TextAttributesTest, testToDynamic) {
  auto textAttributes = TextAttributes{};
  textAttributes.foregroundColor = {
      colorFromComponents({200 / 255.0, 153 / 255.0, 100 / 255.0, 1.0})};
  textAttributes.opacity = 0.5;
  textAttributes.fontStyle = FontStyle::Italic;
  textAttributes.fontWeight = FontWeight::Thin;
  textAttributes.fontVariant = FontVariant::TabularNums;

  auto result = toDynamic(textAttributes);
  ABI49_0_0EXPECT_EQ(
      result["foregroundColor"], toDynamic(textAttributes.foregroundColor));
  ABI49_0_0EXPECT_EQ(result["opacity"], textAttributes.opacity);
  ABI49_0_0EXPECT_EQ(result["fontStyle"], toString(textAttributes.fontStyle.value()));
  ABI49_0_0EXPECT_EQ(result["fontWeight"], toString(textAttributes.fontWeight.value()));
}

#endif

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
