/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTTextManager.h"

#import <CSSLayout/ABI10_0_0CSSLayout.h>
#import "ABI10_0_0RCTAccessibilityManager.h"
#import "ABI10_0_0RCTAssert.h"
#import "ABI10_0_0RCTConvert.h"
#import "ABI10_0_0RCTLog.h"
#import "ABI10_0_0RCTShadowRawText.h"
#import "ABI10_0_0RCTShadowText.h"
#import "ABI10_0_0RCTText.h"
#import "ABI10_0_0RCTTextView.h"
#import "UIView+ReactABI10_0_0.h"

static void collectDirtyNonTextDescendants(ABI10_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI10_0_0RCTShadowView *child in shadowView.ReactABI10_0_0Subviews) {
    if ([child isKindOfClass:[ABI10_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI10_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI10_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI10_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI10_0_0CSSMeasureMode)widthMode;

@end


@implementation ABI10_0_0RCTTextManager

ABI10_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI10_0_0RCTText new];
}

- (ABI10_0_0RCTShadowView *)shadowView
{
  return [ABI10_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI10_0_0RCTTextDecorationLineType)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI10_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)

- (ABI10_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI10_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI10_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI10_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI10_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI10_0_0RCTShadowView *shadowView = queue[i];
      ABI10_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI10_0_0RCTShadowText class]]) {
        ((ABI10_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI10_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI10_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI10_0_0RCTShadowRawText class]]) {
        ABI10_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI10_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI10_0_0RCTShadowView *child in [shadowView ReactABI10_0_0Subviews]) {
          if ([child isTextDirty]) {
            [queue addObject:child];
          }
        }
      }

      [shadowView setTextComputed];
    }
  }

  return nil;
}

- (ABI10_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI10_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI10_0_0Tag = shadowView.ReactABI10_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI10_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI10_0_0RCTText *> *viewRegistry) {
    ABI10_0_0RCTText *text = viewRegistry[ReactABI10_0_0Tag];
    text.contentInset = padding;
  };
}

@end
