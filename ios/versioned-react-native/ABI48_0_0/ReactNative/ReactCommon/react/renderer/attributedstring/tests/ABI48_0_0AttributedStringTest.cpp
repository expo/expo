/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/TextAttributes.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/conversions.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/primitives.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/conversions.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

#ifdef ANDROID

TEST(AttributedStringTest, testToDynamic) {
  auto attributedString = AttributedString{};
  auto fragment = AttributedString::Fragment{};
  fragment.string = "test";

  auto text = TextAttributes{};
  text.foregroundColor = {
      colorFromComponents({100 / 255.0, 153 / 255.0, 200 / 255.0, 1.0})};
  text.opacity = 0.5;
  text.fontStyle = FontStyle::Italic;
  text.fontWeight = FontWeight::Thin;
  text.fontVariant = FontVariant::TabularNums;
  fragment.textAttributes = text;

  attributedString.appendFragment(fragment);

  auto result = toDynamic(attributedString);
  ABI48_0_0EXPECT_EQ(result["string"], fragment.string);
  auto textAttribute = result["fragments"][0]["textAttributes"];
  ABI48_0_0EXPECT_EQ(textAttribute["foregroundColor"], toDynamic(text.foregroundColor));
  ABI48_0_0EXPECT_EQ(textAttribute["opacity"], text.opacity);
  ABI48_0_0EXPECT_EQ(textAttribute["fontStyle"], toString(text.fontStyle.value()));
  ABI48_0_0EXPECT_EQ(textAttribute["fontWeight"], toString(text.fontWeight.value()));
}

#endif

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
