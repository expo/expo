/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>
#include <optional>

#include <folly/Hash.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0primitives.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutPrimitives.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ReactPrimitives.h>
#include <ABI49_0_0React/renderer/debug/ABI49_0_0DebugStringConvertible.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Color.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Float.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Size.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class TextAttributes;

using SharedTextAttributes = std::shared_ptr<const TextAttributes>;

class TextAttributes : public DebugStringConvertible {
 public:
  /*
   * Returns TextAttribute object which has actual default attribute values
   * (e.g. `foregroundColor = black`), in oppose to TextAttribute's default
   * constructor which creates an object with nulled attributes.
   */
  static TextAttributes defaultTextAttributes();

#pragma mark - Fields

  // Color
  SharedColor foregroundColor{};
  SharedColor backgroundColor{};
  Float opacity{std::numeric_limits<Float>::quiet_NaN()};

  // Font
  std::string fontFamily{""};
  Float fontSize{std::numeric_limits<Float>::quiet_NaN()};
  Float fontSizeMultiplier{std::numeric_limits<Float>::quiet_NaN()};
  std::optional<FontWeight> fontWeight{};
  std::optional<FontStyle> fontStyle{};
  std::optional<FontVariant> fontVariant{};
  std::optional<bool> allowFontScaling{};
  std::optional<DynamicTypeRamp> dynamicTypeRamp{};
  Float letterSpacing{std::numeric_limits<Float>::quiet_NaN()};
  std::optional<TextTransform> textTransform{};

  // Paragraph Styles
  Float lineHeight{std::numeric_limits<Float>::quiet_NaN()};
  std::optional<TextAlignment> alignment{};
  std::optional<WritingDirection> baseWritingDirection{};
  std::optional<LineBreakStrategy> lineBreakStrategy{};

  // Decoration
  SharedColor textDecorationColor{};
  std::optional<TextDecorationLineType> textDecorationLineType{};
  std::optional<TextDecorationStyle> textDecorationStyle{};

  // Shadow
  // TODO: Use `Point` type instead of `Size` for `textShadowOffset` attribute.
  std::optional<Size> textShadowOffset{};
  Float textShadowRadius{std::numeric_limits<Float>::quiet_NaN()};
  SharedColor textShadowColor{};

  // Special
  std::optional<bool> isHighlighted{};

  // TODO T59221129: document where this value comes from and how it is set.
  // It's not clear if this is being used properly, or if it's being set at all.
  // Currently, it is intentionally *not* being set as part of BaseTextProps
  // construction.
  std::optional<LayoutDirection> layoutDirection{};
  std::optional<AccessibilityRole> accessibilityRole{};

#pragma mark - Operations

  void apply(TextAttributes textAttributes);

#pragma mark - Operators

  bool operator==(const TextAttributes &rhs) const;
  bool operator!=(const TextAttributes &rhs) const;

#pragma mark - DebugStringConvertible

#if ABI49_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook

namespace std {

template <>
struct hash<ABI49_0_0facebook::ABI49_0_0React::TextAttributes> {
  size_t operator()(
      const ABI49_0_0facebook::ABI49_0_0React::TextAttributes &textAttributes) const {
    return folly::hash::hash_combine(
        0,
        textAttributes.foregroundColor,
        textAttributes.backgroundColor,
        textAttributes.opacity,
        textAttributes.fontFamily,
        textAttributes.fontSize,
        textAttributes.fontSizeMultiplier,
        textAttributes.fontWeight,
        textAttributes.fontStyle,
        textAttributes.fontVariant,
        textAttributes.allowFontScaling,
        textAttributes.letterSpacing,
        textAttributes.textTransform,
        textAttributes.lineHeight,
        textAttributes.alignment,
        textAttributes.baseWritingDirection,
        textAttributes.lineBreakStrategy,
        textAttributes.textDecorationColor,
        textAttributes.textDecorationLineType,
        textAttributes.textDecorationStyle,
        textAttributes.textShadowOffset,
        textAttributes.textShadowRadius,
        textAttributes.textShadowColor,
        textAttributes.isHighlighted,
        textAttributes.layoutDirection,
        textAttributes.accessibilityRole);
  }
};
} // namespace std
