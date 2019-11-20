/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0RCTBaseTextViewManager.h>

@implementation ABI36_0_0RCTBaseTextViewManager

ABI36_0_0RCT_EXPORT_MODULE(ABI36_0_0RCTBaseText)

- (UIView *)view
{
  ABI36_0_0RCTAssert(NO, @"The `-[ABI36_0_0RCTBaseTextViewManager view]` property must be overridden in subclass.");
  return nil;
}

- (ABI36_0_0RCTShadowView *)shadowView
{
  ABI36_0_0RCTAssert(NO, @"The `-[ABI36_0_0RCTBaseTextViewManager shadowView]` property must be overridden in subclass.");
  return nil;
}

#pragma mark - Text Attributes

// Color
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(color, textAttributes.foregroundColor, UIColor)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(backgroundColor, textAttributes.backgroundColor, UIColor)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(opacity, textAttributes.opacity, CGFloat)
// Font
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(fontFamily, textAttributes.fontFamily, NSString)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(fontSize, textAttributes.fontSize, CGFloat)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(fontWeight, textAttributes.fontWeight, NSString)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(fontStyle, textAttributes.fontStyle, NSString)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(fontVariant, textAttributes.fontVariant, NSArray)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(allowFontScaling, textAttributes.allowFontScaling, BOOL)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(maxFontSizeMultiplier, textAttributes.maxFontSizeMultiplier, CGFloat)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(letterSpacing, textAttributes.letterSpacing, CGFloat)
// Paragraph Styles
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(lineHeight, textAttributes.lineHeight, CGFloat)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(textAlign, textAttributes.alignment, NSTextAlignment)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(writingDirection, textAttributes.baseWritingDirection, NSWritingDirection)
// Decoration
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(textDecorationColor, textAttributes.textDecorationColor, UIColor)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(textDecorationStyle, textAttributes.textDecorationStyle, NSUnderlineStyle)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(textDecorationLine, textAttributes.textDecorationLine, ABI36_0_0RCTTextDecorationLineType)
// Shadow
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(textShadowOffset, textAttributes.textShadowOffset, CGSize)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(textShadowRadius, textAttributes.textShadowRadius, CGFloat)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(textShadowColor, textAttributes.textShadowColor, UIColor)
// Special
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(isHighlighted, textAttributes.isHighlighted, BOOL)
ABI36_0_0RCT_REMAP_SHADOW_PROPERTY(textTransform, textAttributes.textTransform, ABI36_0_0RCTTextTransform)

@end
