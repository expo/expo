/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0BaseTextProps.h"

#include <ABI42_0_0React/attributedstring/conversions.h>
#include <ABI42_0_0React/core/propsConversions.h>
#include <ABI42_0_0React/debug/DebugStringConvertibleItem.h>
#include <ABI42_0_0React/graphics/conversions.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

static TextAttributes convertRawProp(
    const RawProps &rawProps,
    const TextAttributes sourceTextAttributes,
    const TextAttributes defaultTextAttributes) {
  auto textAttributes = TextAttributes{};

  // Color
  textAttributes.foregroundColor = convertRawProp(
      rawProps,
      "color",
      sourceTextAttributes.foregroundColor,
      defaultTextAttributes.foregroundColor);
  textAttributes.backgroundColor = convertRawProp(
      rawProps,
      "backgroundColor",
      sourceTextAttributes.backgroundColor,
      defaultTextAttributes.backgroundColor);
  textAttributes.opacity = convertRawProp(
      rawProps,
      "opacity",
      sourceTextAttributes.opacity,
      defaultTextAttributes.opacity);

  // Font
  textAttributes.fontFamily = convertRawProp(
      rawProps,
      "fontFamily",
      sourceTextAttributes.fontFamily,
      defaultTextAttributes.fontFamily);
  textAttributes.fontSize = convertRawProp(
      rawProps,
      "fontSize",
      sourceTextAttributes.fontSize,
      defaultTextAttributes.fontSize);
  textAttributes.fontSizeMultiplier = convertRawProp(
      rawProps,
      "fontSizeMultiplier",
      sourceTextAttributes.fontSizeMultiplier,
      defaultTextAttributes.fontSizeMultiplier);
  textAttributes.fontWeight = convertRawProp(
      rawProps,
      "fontWeight",
      sourceTextAttributes.fontWeight,
      defaultTextAttributes.fontWeight);
  textAttributes.fontStyle = convertRawProp(
      rawProps,
      "fontStyle",
      sourceTextAttributes.fontStyle,
      defaultTextAttributes.fontStyle);
  textAttributes.fontVariant = convertRawProp(
      rawProps,
      "fontVariant",
      sourceTextAttributes.fontVariant,
      defaultTextAttributes.fontVariant);
  textAttributes.allowFontScaling = convertRawProp(
      rawProps,
      "allowFontScaling",
      sourceTextAttributes.allowFontScaling,
      defaultTextAttributes.allowFontScaling);
  textAttributes.letterSpacing = convertRawProp(
      rawProps,
      "letterSpacing",
      sourceTextAttributes.letterSpacing,
      defaultTextAttributes.letterSpacing);

  // Paragraph
  textAttributes.lineHeight = convertRawProp(
      rawProps,
      "lineHeight",
      sourceTextAttributes.lineHeight,
      defaultTextAttributes.lineHeight);
  textAttributes.alignment = convertRawProp(
      rawProps,
      "textAlign",
      sourceTextAttributes.alignment,
      defaultTextAttributes.alignment);
  textAttributes.baseWritingDirection = convertRawProp(
      rawProps,
      "baseWritingDirection",
      sourceTextAttributes.baseWritingDirection,
      defaultTextAttributes.baseWritingDirection);

  // Decoration
  textAttributes.textDecorationColor = convertRawProp(
      rawProps,
      "textDecorationColor",
      sourceTextAttributes.textDecorationColor,
      defaultTextAttributes.textDecorationColor);
  textAttributes.textDecorationLineType = convertRawProp(
      rawProps,
      "textDecorationLine",
      sourceTextAttributes.textDecorationLineType,
      defaultTextAttributes.textDecorationLineType);
  textAttributes.textDecorationLineStyle = convertRawProp(
      rawProps,
      "textDecorationLineStyle",
      sourceTextAttributes.textDecorationLineStyle,
      defaultTextAttributes.textDecorationLineStyle);
  textAttributes.textDecorationLinePattern = convertRawProp(
      rawProps,
      "textDecorationLinePattern",
      sourceTextAttributes.textDecorationLinePattern,
      defaultTextAttributes.textDecorationLinePattern);

  // Shadow
  textAttributes.textShadowOffset = convertRawProp(
      rawProps,
      "textShadowOffset",
      sourceTextAttributes.textShadowOffset,
      defaultTextAttributes.textShadowOffset);
  textAttributes.textShadowRadius = convertRawProp(
      rawProps,
      "textShadowRadius",
      sourceTextAttributes.textShadowRadius,
      defaultTextAttributes.textShadowRadius);
  textAttributes.textShadowColor = convertRawProp(
      rawProps,
      "textShadowColor",
      sourceTextAttributes.textShadowColor,
      defaultTextAttributes.textShadowColor);

  // Special
  textAttributes.isHighlighted = convertRawProp(
      rawProps,
      "isHighlighted",
      sourceTextAttributes.isHighlighted,
      defaultTextAttributes.isHighlighted);

  return textAttributes;
}

BaseTextProps::BaseTextProps(
    const BaseTextProps &sourceProps,
    const RawProps &rawProps)
    : textAttributes(convertRawProp(
          rawProps,
          sourceProps.textAttributes,
          TextAttributes{})){};

#pragma mark - DebugStringConvertible

#if ABI42_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList BaseTextProps::getDebugProps() const {
  return textAttributes.getDebugProps();
}
#endif

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
