/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <assert.h>
#include <gtest/gtest.h>
#include <ABI41_0_0React/attributedstring/TextAttributes.h>
#include <ABI41_0_0React/attributedstring/conversions.h>
#include <ABI41_0_0React/attributedstring/primitives.h>
#include <ABI41_0_0React/graphics/conversions.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

#ifdef ANDROID

TEST(AttributedStringTest, testToDynamic) {
  auto attString = new AttributedString();
  auto fragment = new AttributedString::Fragment();
  fragment->string = "test";

  auto text = new TextAttributes();
  text->foregroundColor = {
      colorFromComponents({100 / 255.0, 153 / 255.0, 200 / 255.0, 1.0})};
  text->opacity = 0.5;
  text->fontStyle = FontStyle::Italic;
  text->fontWeight = FontWeight::Thin;
  text->fontVariant = FontVariant::TabularNums;
  fragment->textAttributes = *text;

  attString->prependFragment(*fragment);

  auto result = toDynamic(*attString);
  assert(result["string"] == fragment->string);
  auto textAttribute = result["fragments"][0]["textAttributes"];
  assert(textAttribute["foregroundColor"] == toDynamic(text->foregroundColor));
  assert(textAttribute["opacity"] == text->opacity);
  assert(textAttribute["fontStyle"] == toString(*text->fontStyle));
  assert(textAttribute["fontWeight"] == toString(*text->fontWeight));
}

#endif

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
