/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ABI46_0_0React/ABI46_0_0renderer/textlayoutmanager/ABI46_0_0RCTFontProperties.h>
#include <ABI46_0_0React/ABI46_0_0renderer/textlayoutmanager/ABI46_0_0RCTFontUtils.h>

using namespace ABI46_0_0facebook::ABI46_0_0React;

inline static NSTextAlignment ABI46_0_0RCTNSTextAlignmentFromTextAlignment(TextAlignment textAlignment)
{
  switch (textAlignment) {
    case TextAlignment::Natural:
      return NSTextAlignmentNatural;
    case TextAlignment::Left:
      return NSTextAlignmentLeft;
    case TextAlignment::Right:
      return NSTextAlignmentRight;
    case TextAlignment::Center:
      return NSTextAlignmentCenter;
    case TextAlignment::Justified:
      return NSTextAlignmentJustified;
  }
}

inline static NSWritingDirection ABI46_0_0RCTNSWritingDirectionFromWritingDirection(WritingDirection writingDirection)
{
  switch (writingDirection) {
    case WritingDirection::Natural:
      return NSWritingDirectionNatural;
    case WritingDirection::LeftToRight:
      return NSWritingDirectionLeftToRight;
    case WritingDirection::RightToLeft:
      return NSWritingDirectionRightToLeft;
  }
}

inline static ABI46_0_0RCTFontStyle ABI46_0_0RCTFontStyleFromFontStyle(FontStyle fontStyle)
{
  switch (fontStyle) {
    case FontStyle::Normal:
      return ABI46_0_0RCTFontStyleNormal;
    case FontStyle::Italic:
      return ABI46_0_0RCTFontStyleItalic;
    case FontStyle::Oblique:
      return ABI46_0_0RCTFontStyleOblique;
  }
}

inline static ABI46_0_0RCTFontVariant ABI46_0_0RCTFontVariantFromFontVariant(FontVariant fontVariant)
{
  return (ABI46_0_0RCTFontVariant)fontVariant;
}

inline static NSUnderlineStyle ABI46_0_0RCTNSUnderlineStyleFromTextDecorationStyle(TextDecorationStyle textDecorationStyle)
{
  switch (textDecorationStyle) {
    case TextDecorationStyle::Solid:
      return NSUnderlineStyleSingle;
    case TextDecorationStyle::Double:
      return NSUnderlineStyleDouble;
    case TextDecorationStyle::Dashed:
      return NSUnderlinePatternDash | NSUnderlineStyleSingle;
    case TextDecorationStyle::Dotted:
      return NSUnderlinePatternDot | NSUnderlineStyleSingle;
  }
}

inline static UIColor *ABI46_0_0RCTUIColorFromSharedColor(const SharedColor &sharedColor)
{
  if (!sharedColor) {
    return nil;
  }

  if (*ABI46_0_0facebook::ABI46_0_0React::clearColor() == *sharedColor) {
    return [UIColor clearColor];
  }

  if (*ABI46_0_0facebook::ABI46_0_0React::blackColor() == *sharedColor) {
    return [UIColor blackColor];
  }

  if (*ABI46_0_0facebook::ABI46_0_0React::whiteColor() == *sharedColor) {
    return [UIColor whiteColor];
  }

  auto components = ABI46_0_0facebook::ABI46_0_0React::colorComponentsFromColor(sharedColor);
  return [UIColor colorWithRed:components.red green:components.green blue:components.blue alpha:components.alpha];
}
