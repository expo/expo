/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <ABI44_0_0React/ABI44_0_0renderer/textlayoutmanager/ABI44_0_0RCTFontProperties.h>
#include <ABI44_0_0React/ABI44_0_0renderer/textlayoutmanager/ABI44_0_0RCTFontUtils.h>

using namespace ABI44_0_0facebook::ABI44_0_0React;

inline static NSTextAlignment ABI44_0_0RCTNSTextAlignmentFromTextAlignment(TextAlignment textAlignment)
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

inline static NSWritingDirection ABI44_0_0RCTNSWritingDirectionFromWritingDirection(WritingDirection writingDirection)
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

inline static ABI44_0_0RCTFontStyle ABI44_0_0RCTFontStyleFromFontStyle(FontStyle fontStyle)
{
  switch (fontStyle) {
    case FontStyle::Normal:
      return ABI44_0_0RCTFontStyleNormal;
    case FontStyle::Italic:
      return ABI44_0_0RCTFontStyleItalic;
    case FontStyle::Oblique:
      return ABI44_0_0RCTFontStyleOblique;
  }
}

inline static ABI44_0_0RCTFontVariant ABI44_0_0RCTFontVariantFromFontVariant(FontVariant fontVariant)
{
  return (ABI44_0_0RCTFontVariant)fontVariant;
}

inline static NSUnderlineStyle ABI44_0_0RCTNSUnderlineStyleFromStyleAndPattern(
    TextDecorationLineStyle textDecorationLineStyle,
    TextDecorationLinePattern textDecorationLinePattern)
{
  NSUnderlineStyle style = NSUnderlineStyleNone;

  switch (textDecorationLineStyle) {
    case TextDecorationLineStyle::Single:
      style = NSUnderlineStyle(style | NSUnderlineStyleSingle);
      break;
    case TextDecorationLineStyle::Thick:
      style = NSUnderlineStyle(style | NSUnderlineStyleThick);
      break;
    case TextDecorationLineStyle::Double:
      style = NSUnderlineStyle(style | NSUnderlineStyleDouble);
      break;
  }

  switch (textDecorationLinePattern) {
    case TextDecorationLinePattern::Solid:
      style = NSUnderlineStyle(style | NSUnderlinePatternSolid);
      break;
    case TextDecorationLinePattern::Dash:
      style = NSUnderlineStyle(style | NSUnderlinePatternDash);
      break;
    case TextDecorationLinePattern::Dot:
      style = NSUnderlineStyle(style | NSUnderlinePatternDot);
      break;
    case TextDecorationLinePattern::DashDot:
      style = NSUnderlineStyle(style | NSUnderlinePatternDashDot);
      break;
    case TextDecorationLinePattern::DashDotDot:
      style = NSUnderlineStyle(style | NSUnderlinePatternDashDotDot);
      break;
  }

  return style;
}

inline static UIColor *ABI44_0_0RCTUIColorFromSharedColor(const SharedColor &sharedColor)
{
  if (!sharedColor) {
    return nil;
  }

  if (*ABI44_0_0facebook::ABI44_0_0React::clearColor() == *sharedColor) {
    return [UIColor clearColor];
  }

  if (*ABI44_0_0facebook::ABI44_0_0React::blackColor() == *sharedColor) {
    return [UIColor blackColor];
  }

  if (*ABI44_0_0facebook::ABI44_0_0React::whiteColor() == *sharedColor) {
    return [UIColor whiteColor];
  }

  auto components = ABI44_0_0facebook::ABI44_0_0React::colorComponentsFromColor(sharedColor);
  return [UIColor colorWithRed:components.red green:components.green blue:components.blue alpha:components.alpha];
}
