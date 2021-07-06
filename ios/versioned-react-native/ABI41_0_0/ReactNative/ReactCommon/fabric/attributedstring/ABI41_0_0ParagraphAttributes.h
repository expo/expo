/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>

#include <folly/Hash.h>
#include <ABI41_0_0React/attributedstring/primitives.h>
#include <ABI41_0_0React/debug/DebugStringConvertible.h>
#include <ABI41_0_0React/graphics/Geometry.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

class ParagraphAttributes;

using SharedParagraphAttributes = std::shared_ptr<const ParagraphAttributes>;

/*
 * Represents all visual attributes of a paragraph of text.
 * Two data structures, ParagraphAttributes and AttributedText, should be
 * enough to define visual representation of a piece of text on the screen.
 */
class ParagraphAttributes : public DebugStringConvertible {
 public:
#pragma mark - Fields

  /*
   * Maximum number of lines which paragraph can take.
   * Zero value represents "no limit".
   */
  int maximumNumberOfLines{};

  /*
   * In case if a text cannot fit given boundaries, defines a place where
   * an ellipsize should be placed.
   */
  EllipsizeMode ellipsizeMode{};

  TextBreakStrategy textBreakStrategy{};

  /*
   * Enables font size adjustment to fit constrained boundaries.
   */
  bool adjustsFontSizeToFit{};

  /*
   * In case of font size adjustment enabled, defines minimum and maximum
   * font sizes.
   */
  Float minimumFontSize{std::numeric_limits<Float>::quiet_NaN()};
  Float maximumFontSize{std::numeric_limits<Float>::quiet_NaN()};

  bool operator==(const ParagraphAttributes &) const;
  bool operator!=(const ParagraphAttributes &) const;

#pragma mark - DebugStringConvertible

#if ABI41_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook

namespace std {

template <>
struct hash<ABI41_0_0facebook::ABI41_0_0React::ParagraphAttributes> {
  size_t operator()(
      const ABI41_0_0facebook::ABI41_0_0React::ParagraphAttributes &attributes) const {
    return folly::hash::hash_combine(
        0,
        attributes.maximumNumberOfLines,
        attributes.ellipsizeMode,
        attributes.textBreakStrategy,
        attributes.adjustsFontSizeToFit,
        attributes.minimumFontSize,
        attributes.maximumFontSize);
  }
};
} // namespace std
