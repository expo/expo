/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTAttributedTextUtils.h"

#include <ABI43_0_0React/ABI43_0_0renderer/core/LayoutableShadowNode.h>
#include <ABI43_0_0React/ABI43_0_0renderer/textlayoutmanager/ABI43_0_0RCTFontProperties.h>
#include <ABI43_0_0React/ABI43_0_0renderer/textlayoutmanager/ABI43_0_0RCTFontUtils.h>
#include <ABI43_0_0React/ABI43_0_0renderer/textlayoutmanager/ABI43_0_0RCTTextPrimitivesConversions.h>
#include <ABI43_0_0React/ABI43_0_0utils/ManagedObjectWrapper.h>

using namespace ABI43_0_0facebook::ABI43_0_0React;

@implementation ABI43_0_0RCTWeakEventEmitterWrapper {
  std::weak_ptr<const EventEmitter> _weakEventEmitter;
}

- (void)setEventEmitter:(SharedEventEmitter)eventEmitter
{
  _weakEventEmitter = eventEmitter;
}

- (SharedEventEmitter)eventEmitter
{
  return _weakEventEmitter.lock();
}

- (void)dealloc
{
  _weakEventEmitter.reset();
}

@end

inline static UIFontWeight ABI43_0_0RCTUIFontWeightFromInteger(NSInteger fontWeight)
{
  assert(fontWeight > 50);
  assert(fontWeight < 950);

  static UIFontWeight weights[] = {/* ~100 */ UIFontWeightUltraLight,
                                   /* ~200 */ UIFontWeightThin,
                                   /* ~300 */ UIFontWeightLight,
                                   /* ~400 */ UIFontWeightRegular,
                                   /* ~500 */ UIFontWeightMedium,
                                   /* ~600 */ UIFontWeightSemibold,
                                   /* ~700 */ UIFontWeightBold,
                                   /* ~800 */ UIFontWeightHeavy,
                                   /* ~900 */ UIFontWeightBlack};
  // The expression is designed to convert something like 760 or 830 to 7.
  return weights[(fontWeight + 50) / 100 - 1];
}

inline static UIFont *ABI43_0_0RCTEffectiveFontFromTextAttributes(const TextAttributes &textAttributes)
{
  NSString *fontFamily = [NSString stringWithCString:textAttributes.fontFamily.c_str() encoding:NSUTF8StringEncoding];

  ABI43_0_0RCTFontProperties fontProperties;
  fontProperties.family = fontFamily;
  fontProperties.size = textAttributes.fontSize;
  fontProperties.style = textAttributes.fontStyle.hasValue()
      ? ABI43_0_0RCTFontStyleFromFontStyle(textAttributes.fontStyle.value())
      : ABI43_0_0RCTFontStyleUndefined;
  fontProperties.variant = textAttributes.fontVariant.hasValue()
      ? ABI43_0_0RCTFontVariantFromFontVariant(textAttributes.fontVariant.value())
      : ABI43_0_0RCTFontVariantUndefined;
  fontProperties.weight = textAttributes.fontWeight.hasValue()
      ? ABI43_0_0RCTUIFontWeightFromInteger((NSInteger)textAttributes.fontWeight.value())
      : NAN;
  fontProperties.sizeMultiplier = textAttributes.fontSizeMultiplier;

  return ABI43_0_0RCTFontWithFontProperties(fontProperties);
}

inline static CGFloat ABI43_0_0RCTEffectiveFontSizeMultiplierFromTextAttributes(const TextAttributes &textAttributes)
{
  return textAttributes.allowFontScaling.value_or(true) && !isnan(textAttributes.fontSizeMultiplier)
      ? textAttributes.fontSizeMultiplier
      : 1.0;
}

inline static UIColor *ABI43_0_0RCTEffectiveForegroundColorFromTextAttributes(const TextAttributes &textAttributes)
{
  UIColor *effectiveForegroundColor = ABI43_0_0RCTUIColorFromSharedColor(textAttributes.foregroundColor) ?: [UIColor blackColor];

  if (!isnan(textAttributes.opacity)) {
    effectiveForegroundColor = [effectiveForegroundColor
        colorWithAlphaComponent:CGColorGetAlpha(effectiveForegroundColor.CGColor) * textAttributes.opacity];
  }

  return effectiveForegroundColor;
}

inline static UIColor *ABI43_0_0RCTEffectiveBackgroundColorFromTextAttributes(const TextAttributes &textAttributes)
{
  UIColor *effectiveBackgroundColor = ABI43_0_0RCTUIColorFromSharedColor(textAttributes.backgroundColor);

  if (effectiveBackgroundColor && !isnan(textAttributes.opacity)) {
    effectiveBackgroundColor = [effectiveBackgroundColor
        colorWithAlphaComponent:CGColorGetAlpha(effectiveBackgroundColor.CGColor) * textAttributes.opacity];
  }

  return effectiveBackgroundColor ?: [UIColor clearColor];
}

NSDictionary<NSAttributedStringKey, id> *ABI43_0_0RCTNSTextAttributesFromTextAttributes(TextAttributes const &textAttributes)
{
  NSMutableDictionary<NSAttributedStringKey, id> *attributes = [NSMutableDictionary dictionaryWithCapacity:10];

  // Font
  UIFont *font = ABI43_0_0RCTEffectiveFontFromTextAttributes(textAttributes);
  if (font) {
    attributes[NSFontAttributeName] = font;
  }

  // Colors
  UIColor *effectiveForegroundColor = ABI43_0_0RCTEffectiveForegroundColorFromTextAttributes(textAttributes);

  if (textAttributes.foregroundColor || !isnan(textAttributes.opacity)) {
    attributes[NSForegroundColorAttributeName] = effectiveForegroundColor;
  }

  if (textAttributes.backgroundColor || !isnan(textAttributes.opacity)) {
    attributes[NSBackgroundColorAttributeName] = ABI43_0_0RCTEffectiveBackgroundColorFromTextAttributes(textAttributes);
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

    paragraphStyle.alignment = ABI43_0_0RCTNSTextAlignmentFromTextAlignment(textAlignment);
    isParagraphStyleUsed = YES;
  }

  if (textAttributes.baseWritingDirection.hasValue()) {
    paragraphStyle.baseWritingDirection =
        ABI43_0_0RCTNSWritingDirectionFromWritingDirection(textAttributes.baseWritingDirection.value());
    isParagraphStyleUsed = YES;
  }

  if (!isnan(textAttributes.lineHeight)) {
    CGFloat lineHeight = textAttributes.lineHeight * ABI43_0_0RCTEffectiveFontSizeMultiplierFromTextAttributes(textAttributes);
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

    NSUnderlineStyle style = ABI43_0_0RCTNSUnderlineStyleFromStyleAndPattern(
        textAttributes.textDecorationLineStyle.value_or(TextDecorationLineStyle::Single),
        textAttributes.textDecorationLinePattern.value_or(TextDecorationLinePattern::Solid));

    UIColor *textDecorationColor = ABI43_0_0RCTUIColorFromSharedColor(textAttributes.textDecorationColor);

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
    shadow.shadowOffset = CGSize{textShadowOffset.width, textShadowOffset.height};
    shadow.shadowBlurRadius = textAttributes.textShadowRadius;
    shadow.shadowColor = ABI43_0_0RCTUIColorFromSharedColor(textAttributes.textShadowColor);
    attributes[NSShadowAttributeName] = shadow;
  }

  // Special
  if (textAttributes.isHighlighted) {
    attributes[ABI43_0_0RCTAttributedStringIsHighlightedAttributeName] = @YES;
  }

  if (textAttributes.accessibilityRole.hasValue()) {
    auto accessibilityRole = textAttributes.accessibilityRole.value();
    switch (accessibilityRole) {
      case AccessibilityRole::None:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("none");
        break;
      case AccessibilityRole::Button:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("button");
        break;
      case AccessibilityRole::Link:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("link");
        break;
      case AccessibilityRole::Search:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("search");
        break;
      case AccessibilityRole::Image:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("image");
        break;
      case AccessibilityRole::Imagebutton:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("imagebutton");
        break;
      case AccessibilityRole::Keyboardkey:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("keyboardkey");
        break;
      case AccessibilityRole::Text:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("text");
        break;
      case AccessibilityRole::Adjustable:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("adjustable");
        break;
      case AccessibilityRole::Summary:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("summary");
        break;
      case AccessibilityRole::Header:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("header");
        break;
      case AccessibilityRole::Alert:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("alert");
        break;
      case AccessibilityRole::Checkbox:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("checkbox");
        break;
      case AccessibilityRole::Combobox:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("combobox");
        break;
      case AccessibilityRole::Menu:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("menu");
        break;
      case AccessibilityRole::Menubar:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("menubar");
        break;
      case AccessibilityRole::Menuitem:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("menuitem");
        break;
      case AccessibilityRole::Progressbar:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("progressbar");
        break;
      case AccessibilityRole::Radio:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("radio");
        break;
      case AccessibilityRole::Radiogroup:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("radiogroup");
        break;
      case AccessibilityRole::Scrollbar:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("scrollbar");
        break;
      case AccessibilityRole::Spinbutton:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("spinbutton");
        break;
      case AccessibilityRole::Switch:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("switch");
        break;
      case AccessibilityRole::Tab:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("tab");
        break;
      case AccessibilityRole::Tablist:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("tablist");
        break;
      case AccessibilityRole::Timer:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("timer");
        break;
      case AccessibilityRole::Toolbar:
        attributes[ABI43_0_0RCTTextAttributesAccessibilityRoleAttributeName] = @("toolbar");
        break;
    };
  }

  return [attributes copy];
}

NSAttributedString *ABI43_0_0RCTNSAttributedStringFromAttributedString(const AttributedString &attributedString)
{
  static UIImage *placeholderImage;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    placeholderImage = [[UIImage alloc] init];
  });

  NSMutableAttributedString *nsAttributedString = [[NSMutableAttributedString alloc] init];

  [nsAttributedString beginEditing];

  for (auto fragment : attributedString.getFragments()) {
    NSMutableAttributedString *nsAttributedStringFragment;

    if (fragment.isAttachment()) {
      auto layoutMetrics = fragment.parentShadowView.layoutMetrics;
      CGRect bounds = {.origin = {.x = layoutMetrics.frame.origin.x, .y = layoutMetrics.frame.origin.y},
                       .size = {.width = layoutMetrics.frame.size.width, .height = layoutMetrics.frame.size.height}};

      NSTextAttachment *attachment = [NSTextAttachment new];
      attachment.image = placeholderImage;
      attachment.bounds = bounds;

      nsAttributedStringFragment = [[NSMutableAttributedString attributedStringWithAttachment:attachment] mutableCopy];
    } else {
      NSString *string = [NSString stringWithCString:fragment.string.c_str() encoding:NSUTF8StringEncoding];

      nsAttributedStringFragment = [[NSMutableAttributedString alloc]
          initWithString:string
              attributes:ABI43_0_0RCTNSTextAttributesFromTextAttributes(fragment.textAttributes)];
    }

    if (fragment.parentShadowView.componentHandle) {
      ABI43_0_0RCTWeakEventEmitterWrapper *eventEmitterWrapper = [ABI43_0_0RCTWeakEventEmitterWrapper new];
      eventEmitterWrapper.eventEmitter = fragment.parentShadowView.eventEmitter;

      NSDictionary<NSAttributedStringKey, id> *additionalTextAttributes =
          @{ABI43_0_0RCTAttributedStringEventEmitterKey : eventEmitterWrapper};

      [nsAttributedStringFragment addAttributes:additionalTextAttributes
                                          range:NSMakeRange(0, nsAttributedStringFragment.length)];
    }

    [nsAttributedString appendAttributedString:nsAttributedStringFragment];
  }

  [nsAttributedString endEditing];

  return nsAttributedString;
}

NSAttributedString *ABI43_0_0RCTNSAttributedStringFromAttributedStringBox(AttributedStringBox const &attributedStringBox)
{
  switch (attributedStringBox.getMode()) {
    case AttributedStringBox::Mode::Value:
      return ABI43_0_0RCTNSAttributedStringFromAttributedString(attributedStringBox.getValue());
    case AttributedStringBox::Mode::OpaquePointer:
      return (NSAttributedString *)unwrapManagedObject(attributedStringBox.getOpaquePointer());
  }
}

AttributedStringBox ABI43_0_0RCTAttributedStringBoxFromNSAttributedString(NSAttributedString *nsAttributedString)
{
  return nsAttributedString.length ? AttributedStringBox{wrapManagedObject(nsAttributedString)} : AttributedStringBox{};
}
