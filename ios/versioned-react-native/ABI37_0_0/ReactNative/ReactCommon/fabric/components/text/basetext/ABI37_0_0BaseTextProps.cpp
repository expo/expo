/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0BaseTextProps.h"

#include <ABI37_0_0React/attributedstring/conversions.h>
#include <ABI37_0_0React/core/propsConversions.h>
#include <ABI37_0_0React/debug/DebugStringConvertibleItem.h>
#include <ABI37_0_0React/graphics/conversions.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

static TextAttributes convertRawProp(
    const RawProps &rawProps,
    const TextAttributes defaultTextAttributes) {
  auto textAttributes = TextAttributes{};

  // Color
  textAttributes.foregroundColor =
      convertRawProp(rawProps, "color", defaultTextAttributes.foregroundColor);
  textAttributes.backgroundColor = convertRawProp(
      rawProps, "backgroundColor", defaultTextAttributes.backgroundColor);
  textAttributes.opacity =
      convertRawProp(rawProps, "opacity", defaultTextAttributes.opacity);

  // Font
  textAttributes.fontFamily =
      convertRawProp(rawProps, "fontFamily", defaultTextAttributes.fontFamily);
  textAttributes.fontSize =
      convertRawProp(rawProps, "fontSize", defaultTextAttributes.fontSize);
  textAttributes.fontSizeMultiplier = convertRawProp(
      rawProps, "fontSizeMultiplier", defaultTextAttributes.fontSizeMultiplier);
  textAttributes.fontWeight =
      convertRawProp(rawProps, "fontWeight", defaultTextAttributes.fontWeight);
  textAttributes.fontStyle =
      convertRawProp(rawProps, "fontStyle", defaultTextAttributes.fontStyle);
  textAttributes.fontVariant = convertRawProp(
      rawProps, "fontVariant", defaultTextAttributes.fontVariant);
  textAttributes.allowFontScaling = convertRawProp(
      rawProps, "allowFontScaling", defaultTextAttributes.allowFontScaling);
  textAttributes.letterSpacing = convertRawProp(
      rawProps, "letterSpacing", defaultTextAttributes.letterSpacing);

  // Paragraph
  textAttributes.lineHeight =
      convertRawProp(rawProps, "lineHeight", defaultTextAttributes.lineHeight);
  textAttributes.alignment =
      convertRawProp(rawProps, "textAlign", defaultTextAttributes.alignment);
  textAttributes.baseWritingDirection = convertRawProp(
      rawProps,
      "baseWritingDirection",
      defaultTextAttributes.baseWritingDirection);

  // Decoration
  textAttributes.textDecorationColor = convertRawProp(
      rawProps,
      "textDecorationColor",
      defaultTextAttributes.textDecorationColor);
  textAttributes.textDecorationLineType = convertRawProp(
      rawProps,
      "textDecorationLine",
      defaultTextAttributes.textDecorationLineType);
  textAttributes.textDecorationLineStyle = convertRawProp(
      rawProps,
      "textDecorationLineStyle",
      defaultTextAttributes.textDecorationLineStyle);
  textAttributes.textDecorationLinePattern = convertRawProp(
      rawProps,
      "textDecorationLinePattern",
      defaultTextAttributes.textDecorationLinePattern);

  // Shadow
  textAttributes.textShadowOffset = convertRawProp(
      rawProps, "textShadowOffset", defaultTextAttributes.textShadowOffset);
  textAttributes.textShadowRadius = convertRawProp(
      rawProps, "textShadowRadius", defaultTextAttributes.textShadowRadius);
  textAttributes.textShadowColor = convertRawProp(
      rawProps, "textShadowColor", defaultTextAttributes.textShadowColor);

  // Special
  textAttributes.isHighlighted = convertRawProp(
      rawProps, "isHighlighted", defaultTextAttributes.isHighlighted);

  return textAttributes;
}

BaseTextProps::BaseTextProps(
    const BaseTextProps &sourceProps,
    const RawProps &rawProps)
    : textAttributes(convertRawProp(rawProps, sourceProps.textAttributes)){};

#pragma mark - DebugStringConvertible

#if ABI37_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList BaseTextProps::getDebugProps() const {
  return textAttributes.getDebugProps();
}
#endif

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
