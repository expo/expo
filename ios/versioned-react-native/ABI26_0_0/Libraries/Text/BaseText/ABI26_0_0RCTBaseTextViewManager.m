/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTBaseTextViewManager.h"

@implementation ABI26_0_0RCTBaseTextViewManager

ABI26_0_0RCT_EXPORT_MODULE(ABI26_0_0RCTBaseText)

- (UIView *)view
{
  ABI26_0_0RCTAssert(NO, @"The `-[ABI26_0_0RCTBaseTextViewManager view]` property must be overridden in subclass.");
  return nil;
}

- (ABI26_0_0RCTShadowView *)shadowView
{
  ABI26_0_0RCTAssert(NO, @"The `-[ABI26_0_0RCTBaseTextViewManager shadowView]` property must be overridden in subclass.");
  return nil;
}

#pragma mark - Text Attributes

// Color
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(color, textAttributes.foregroundColor, UIColor)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(backgroundColor, textAttributes.backgroundColor, UIColor)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(opacity, textAttributes.opacity, CGFloat)
// Font
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(fontFamily, textAttributes.fontFamily, NSString)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(fontSize, textAttributes.fontSize, CGFloat)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(fontWeight, textAttributes.fontWeight, NSString)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(fontStyle, textAttributes.fontStyle, NSString)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(fontVariant, textAttributes.fontVariant, NSArray)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(allowFontScaling, textAttributes.allowFontScaling, BOOL)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(letterSpacing, textAttributes.letterSpacing, CGFloat)
// Paragraph Styles
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(lineHeight, textAttributes.lineHeight, CGFloat)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(textAlign, textAttributes.alignment, NSTextAlignment)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(writingDirection, textAttributes.baseWritingDirection, NSWritingDirection)
// Decoration
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(textDecorationColor, textAttributes.textDecorationColor, UIColor)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(textDecorationStyle, textAttributes.textDecorationStyle, NSUnderlineStyle)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(textDecorationLine, textAttributes.textDecorationLine, ABI26_0_0RCTTextDecorationLineType)
// Shadow
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(textShadowOffset, textAttributes.textShadowOffset, CGSize)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(textShadowRadius, textAttributes.textShadowRadius, CGFloat)
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(textShadowColor, textAttributes.textShadowColor, UIColor)
// Special
ABI26_0_0RCT_REMAP_SHADOW_PROPERTY(isHighlighted, textAttributes.isHighlighted, BOOL)

@end
