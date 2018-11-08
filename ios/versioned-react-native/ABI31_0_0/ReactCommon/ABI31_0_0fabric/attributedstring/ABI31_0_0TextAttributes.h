/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>

#include <ABI31_0_0fabric/ABI31_0_0attributedstring/primitives.h>
#include <ABI31_0_0fabric/ABI31_0_0core/LayoutPrimitives.h>
#include <ABI31_0_0fabric/ABI31_0_0core/ReactABI31_0_0Primitives.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/DebugStringConvertible.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/Color.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/Geometry.h>
#include <folly/Optional.h>

namespace facebook {
namespace ReactABI31_0_0 {

class TextAttributes;

using SharedTextAttributes = std::shared_ptr<const TextAttributes>;

class TextAttributes:
  public DebugStringConvertible {
public:

#pragma mark - Fields

  // Color
  SharedColor foregroundColor {};
  SharedColor backgroundColor {};
  Float opacity {std::numeric_limits<Float>::quiet_NaN()};

  // Font
  std::string fontFamily {""};
  Float fontSize {std::numeric_limits<Float>::quiet_NaN()};
  Float fontSizeMultiplier {std::numeric_limits<Float>::quiet_NaN()};
  folly::Optional<FontWeight> fontWeight {};
  folly::Optional<FontStyle> fontStyle {};
  folly::Optional<FontVariant> fontVariant {};
  folly::Optional<bool> allowFontScaling {};
  Float letterSpacing {std::numeric_limits<Float>::quiet_NaN()};

  // Paragraph Styles
  Float lineHeight {std::numeric_limits<Float>::quiet_NaN()};
  folly::Optional<TextAlignment> alignment {};
  folly::Optional<WritingDirection> baseWritingDirection {};

  // Decoration
  SharedColor textDecorationColor {};
  folly::Optional<TextDecorationLineType> textDecorationLineType {};
  folly::Optional<TextDecorationLineStyle> textDecorationLineStyle {};
  folly::Optional<TextDecorationLinePattern> textDecorationLinePattern {};

  // Shadow
  // TODO: Use `Point` type instead of `Size` for `textShadowOffset` attribute.
  folly::Optional<Size> textShadowOffset {};
  Float textShadowRadius {std::numeric_limits<Float>::quiet_NaN()};
  SharedColor textShadowColor {};

  // Special
  folly::Optional<bool> isHighlighted {};
  folly::Optional<LayoutDirection> layoutDirection {};

#pragma mark - Operations

  void apply(TextAttributes textAttributes);

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;
};

} // namespace ReactABI31_0_0
} // namespace facebook

