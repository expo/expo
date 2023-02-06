/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <assert.h>
#include <gtest/gtest.h>
#include <ABI48_0_0React/ABI48_0_0debug/ABI48_0_0React_native_assert.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/AttributedString.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/TextAttributes.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/primitives.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/text/ParagraphState.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/text/conversions.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

#ifdef ANDROID

TEST(ParagraphLocalDataTest, testSomething) {
  auto attributedString = AttributedString();
  auto fragment = AttributedString::Fragment();
  fragment.string = "test";

  auto text = TextAttributes();
  text.foregroundColor = {
      colorFromComponents({100 / 255.0, 153 / 255.0, 253 / 255.0, 1.0})};
  text.opacity = 0.5;
  text.fontStyle = FontStyle::Italic;
  text.fontWeight = FontWeight::Thin;
  text.fontVariant = FontVariant::TabularNums;
  fragment.textAttributes = text;
  attString.prependFragment(fragment);

  auto paragraphState = ParagraphState{};
  paragraphLocalData.attributedString = attributedString;

  auto result = toDynamic(paragraphState)["attributedString"];

  ABI48_0_0React_native_assert(result["string"] == fragment.string);
  auto textAttribute = result["fragments"][0]["textAttributes"];
  ABI48_0_0React_native_assert(
      textAttribute["foregroundColor"] == toDynamic(text.foregroundColor));
  ABI48_0_0React_native_assert(textAttribute["opacity"] == text.opacity);
  ABI48_0_0React_native_assert(textAttribute["fontStyle"] == toString(*text.fontStyle));
  ABI48_0_0React_native_assert(
      textAttribute["fontWeight"] == toString(*text.fontWeight));
}

#endif

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
