/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <assert.h>
#include <gtest/gtest.h>
#include <ABI37_0_0React/attributedstring/TextAttributes.h>
#include <ABI37_0_0React/attributedstring/conversions.h>
#include <ABI37_0_0React/attributedstring/primitives.h>
#include <ABI37_0_0React/graphics/conversions.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

#ifdef ANDROID

TEST(TextAttributesTest, testToDynamic) {
  auto text = TextAttributes();
  text.foregroundColor = {
      colorFromComponents({200 / 255.0, 153 / 255.0, 100 / 255.0, 1.0})};
  text.opacity = 0.5;
  text.fontStyle = FontStyle::Italic;
  text.fontWeight = FontWeight::Thin;
  text.fontVariant = FontVariant::TabularNums;

  auto result = toDynamic(text);
  assert(result["foregroundColor"] == toDynamic(text.foregroundColor));
  assert(result["opacity"] == text.opacity);
  assert(result["fontStyle"] == toString(*text.fontStyle));
  assert(result["fontWeight"] == toString(*text.fontWeight));
}

#endif

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
