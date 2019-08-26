/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTAttributedTextUtils.h"

#include <ABI32_0_0fabric/ABI32_0_0core/LayoutableShadowNode.h>
#include <ABI32_0_0fabric/ABI32_0_0textlayoutmanager/ABI32_0_0RCTFontProperties.h>
#include <ABI32_0_0fabric/ABI32_0_0textlayoutmanager/ABI32_0_0RCTFontUtils.h>
#include <ABI32_0_0fabric/ABI32_0_0textlayoutmanager/ABI32_0_0RCTTextPrimitivesConversions.h>

inline static UIFont *ABI32_0_0RCTEffectiveFontFromTextAttributes(const TextAttributes &textAttributes) {
  NSString *fontFamily = [NSString stringWithCString:textAttributes.fontFamily.c_str()
                                            encoding:NSUTF8StringEncoding];

  ABI32_0_0RCTFontProperties fontProperties;
  fontProperties.family = fontFamily;
  fontProperties.size = textAttributes.fontSize;
  fontProperties.style = textAttributes.fontStyle.hasValue() ? ABI32_0_0RCTFontStyleFromFontStyle(textAttributes.fontStyle.value()) : ABI32_0_0RCTFontStyleUndefined;
  fontProperties.variant = textAttributes.fontVariant.hasValue() ? ABI32_0_0RCTFontVariantFromFontVariant(textAttributes.fontVariant.value()) : ABI32_0_0RCTFontVariantDefault;
  fontProperties.weight = textAttributes.fontWeight.hasValue() ? CGFloat(textAttributes.fontWeight.value()) : NAN;
  fontProperties.sizeMultiplier = textAttributes.fontSizeMultiplier;

  return ABI32_0_0RCTFontWithFontProperties(fontProperties);
}

inline static CGFloat ABI32_0_0RCTEffectiveFontSizeMultiplierFromTextAttributes(const TextAttributes &textAttributes) {
  return textAttributes.allowFontScaling.value_or(true) && !isnan(textAttributes.fontSizeMultiplier) ? textAttributes.fontSizeMultiplier : 1.0;
}

inline static UIColor *ABI32_0_0RCTEffectiveForegroundColorFromTextAttributes(const TextAttributes &textAttributes) {
  UIColor *effectiveForegroundColor = ABI32_0_0RCTUIColorFromSharedColor(textAttributes.foregroundColor) ?: [UIColor blackColor];

  if (!isnan(textAttributes.opacity)) {
    effectiveForegroundColor =
      [effectiveForegroundColor colorWithAlphaComponent:CGColorGetAlpha(effectiveForegroundColor.CGColor) * textAttributes.opacity];
  }

  return effectiveForegroundColor;
}

inline static UIColor *ABI32_0_0RCTEffectiveBackgroundColorFromTextAttributes(const TextAttributes &textAttributes) {
  UIColor *effectiveBackgroundColor = ABI32_0_0RCTUIColorFromSharedColor(textAttributes.backgroundColor);

  if (effectiveBackgroundColor && !isnan(textAttributes.opacity)) {
    effectiveBackgroundColor =
      [effectiveBackgroundColor colorWithAlphaComponent:CGColorGetAlpha(effectiveBackgroundColor.CGColor) * textAttributes.opacity];
  }

  return effectiveBackgroundColor ?: [UIColor clearColor];
}

static NSDictionary<NSAttributedStringKey, id> *ABI32_0_0RCTNSTextAttributesFromTextAttributes(const TextAttributes &textAttributes) {
  NSMutableDictionary<NSAttributedStringKey, id> *attributes =
    [NSMutableDictionary dictionaryWithCapacity:10];

  // Font
  UIFont *font = ABI32_0_0RCTEffectiveFontFromTextAttributes(textAttributes);
  if (font) {
    attributes[NSFontAttributeName] = font;
  }

  // Colors
  UIColor *effectiveForegroundColor = ABI32_0_0RCTEffectiveForegroundColorFromTextAttributes(textAttributes);

  if (textAttributes.foregroundColor || !isnan(textAttributes.opacity)) {
    attributes[NSForegroundColorAttributeName] = effectiveForegroundColor;
  }

  if (textAttributes.backgroundColor || !isnan(textAttributes.opacity)) {
    attributes[NSBackgroundColorAttributeName] = ABI32_0_0RCTEffectiveBackgroundColorFromTextAttributes(textAttributes);
  }

  // Kerning
  if (!isnan(textAttributes.letterSpacing)) {
    attributes[NSKernAttributeName] = @(textAttributes.letterSpacing);
  }

  // Paragraph Style
  NSMutableParagraphStyle *paragraphStyle = [NSMutableParagraphStyle new];
  BOOL isParagraphStyleUsed = NO;
  if (textAttributes.alignment.hasValue()) {
    TextAlignment textAlignment = textAttributes.alignment.value_or(TextAlignment::Natural);
    if (textAttributes.layoutDirection.value_or(LayoutDirection::LeftToRight) == LayoutDirection::RightToLeft) {
      if (textAlignment == TextAlignment::Right) {
        textAlignment = TextAlignment::Left;
      } else if (textAlignment == TextAlignment::Left) {
        textAlignment = TextAlignment::Right;
      }
    }

    paragraphStyle.alignment =
      ABI32_0_0RCTNSTextAlignmentFromTextAlignment(textAlignment);
    isParagraphStyleUsed = YES;
  }

  if (textAttributes.baseWritingDirection.hasValue()) {
    paragraphStyle.baseWritingDirection =
      ABI32_0_0RCTNSWritingDirectionFromWritingDirection(textAttributes.baseWritingDirection.value());
    isParagraphStyleUsed = YES;
  }

  if (!isnan(textAttributes.lineHeight)) {
    CGFloat lineHeight =
      textAttributes.lineHeight * ABI32_0_0RCTEffectiveFontSizeMultiplierFromTextAttributes(textAttributes);
    paragraphStyle.minimumLineHeight = lineHeight;
    paragraphStyle.maximumLineHeight = lineHeight;
    isParagraphStyleUsed = YES;
  }

  if (isParagraphStyleUsed) {
    attributes[NSParagraphStyleAttributeName] = paragraphStyle;
  }

  // Decoration
  if (textAttributes.textDecorationLineType.value_or(TextDecorationLineType::None) != TextDecorationLineType::None) {
    auto textDecorationLineType = textAttributes.textDecorationLineType.value();

    NSUnderlineStyle style =
      ABI32_0_0RCTNSUnderlineStyleFromStyleAndPattern(
        textAttributes.textDecorationLineStyle.value_or(TextDecorationLineStyle::Single),
        textAttributes.textDecorationLinePattern.value_or(TextDecorationLinePattern::Solid)
      );

    UIColor *textDecorationColor = ABI32_0_0RCTUIColorFromSharedColor(textAttributes.textDecorationColor);

    // Underline
    if (textDecorationLineType == TextDecorationLineType::Underline ||
        textDecorationLineType == TextDecorationLineType::UnderlineStrikethrough) {

      attributes[NSUnderlineStyleAttributeName] = @(style);

      if (textDecorationColor) {
        attributes[NSUnderlineColorAttributeName] = textDecorationColor;
      }
    }

    // Strikethrough
    if (textDecorationLineType == TextDecorationLineType::Strikethrough ||
        textDecorationLineType == TextDecorationLineType::UnderlineStrikethrough) {

      attributes[NSStrikethroughStyleAttributeName] = @(style);

      if (textDecorationColor) {
        attributes[NSStrikethroughColorAttributeName] = textDecorationColor;
      }
    }
  }

  // Shadow
  if (textAttributes.textShadowOffset.hasValue()) {
    auto textShadowOffset = textAttributes.textShadowOffset.value();
    NSShadow *shadow = [NSShadow new];
    shadow.shadowOffset = CGSize {textShadowOffset.width, textShadowOffset.height};
    shadow.shadowBlurRadius = textAttributes.textShadowRadius;
    shadow.shadowColor = ABI32_0_0RCTUIColorFromSharedColor(textAttributes.textShadowColor);
    attributes[NSShadowAttributeName] = shadow;
  }

  // Special
  if (textAttributes.isHighlighted) {
    attributes[ABI32_0_0RCTAttributedStringIsHighlightedAttributeName] = @YES;
  }

  return [attributes copy];
}

NSAttributedString *ABI32_0_0RCTNSAttributedStringFromAttributedString(const AttributedString &attributedString) {
  NSMutableAttributedString *nsAttributedString = [[NSMutableAttributedString alloc] init];

  [nsAttributedString beginEditing];

  for (auto fragment : attributedString.getFragments()) {
    NSAttributedString *nsAttributedStringFragment;

    auto layoutableShadowNode =
      std::dynamic_pointer_cast<const LayoutableShadowNode>(fragment.shadowNode);

    if (layoutableShadowNode) {
      auto layoutMetrics = layoutableShadowNode->getLayoutMetrics();
      CGRect bounds = {
        .origin = {
          .x = layoutMetrics.frame.origin.x,
          .y = layoutMetrics.frame.origin.y
        },
        .size = {
          .width = layoutMetrics.frame.size.width,
          .height = layoutMetrics.frame.size.height
        }
      };

      NSTextAttachment *attachment = [NSTextAttachment new];
      attachment.bounds = bounds;

      nsAttributedStringFragment = [NSAttributedString attributedStringWithAttachment:attachment];
    } else {
      NSString *string =
        [NSString stringWithCString:fragment.string.c_str()
                           encoding:NSUTF8StringEncoding];

      nsAttributedStringFragment =
        [[NSAttributedString alloc] initWithString:string
                                        attributes:ABI32_0_0RCTNSTextAttributesFromTextAttributes(fragment.textAttributes)];
    }

    NSMutableAttributedString *nsMutableAttributedStringFragment =
      [[NSMutableAttributedString alloc] initWithAttributedString:nsAttributedStringFragment];

    if (fragment.shadowNode) {
      NSDictionary<NSAttributedStringKey, id> *additionalTextAttributes = @{
        ABI32_0_0RCTAttributedStringReactABI32_0_0TagAttributeName: @(fragment.shadowNode->getTag())
      };

      [nsMutableAttributedStringFragment setAttributes:additionalTextAttributes
                                                 range:NSMakeRange(0, nsMutableAttributedStringFragment.length)];
    }

    [nsAttributedString appendAttributedString:nsMutableAttributedStringFragment];
  }

  [nsAttributedString endEditing];

  return nsAttributedString;
}
