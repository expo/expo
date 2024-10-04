/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <assert.h>
#include <gtest/gtest.h>
#include <ABI42_0_0React/attributedstring/ParagraphAttributes.h>
#include <ABI42_0_0React/attributedstring/conversions.h>
#include <ABI42_0_0React/attributedstring/primitives.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

#ifdef ANDROID

TEST(ParagraphAttributesTest, testToDynamic) {
  auto paragraphAttributes = ParagraphAttributes();
  paragraphAttributes.maximumNumberOfLines = 2;
  paragraphAttributes.adjustsFontSizeToFit = false;
  paragraphAttributes.ellipsizeMode = EllipsizeMode::Middle;

  auto result = toDynamic(paragraphAttributes);
  assert(
      result["maximumNumberOfLines"] ==
      paragraphAttributes.maximumNumberOfLines);
  assert(
      result["adjustsFontSizeToFit"] ==
      paragraphAttributes.adjustsFontSizeToFit);
  assert(
      result["ellipsizeMode"] == toString(paragraphAttributes.ellipsizeMode));
}

#endif

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
