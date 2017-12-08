/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTTextManager.h"

#import <ReactABI24_0_0/ABI24_0_0RCTAccessibilityManager.h>
#import <ReactABI24_0_0/ABI24_0_0RCTAssert.h>
#import <ReactABI24_0_0/ABI24_0_0RCTConvert.h>
#import <ReactABI24_0_0/ABI24_0_0RCTLog.h>
#import <ReactABI24_0_0/ABI24_0_0RCTShadowView+Layout.h>
#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>
#import <yogaABI24_0_0/ABI24_0_0Yoga.h>

#import "ABI24_0_0RCTShadowRawText.h"
#import "ABI24_0_0RCTShadowText.h"
#import "ABI24_0_0RCTText.h"
#import "ABI24_0_0RCTTextView.h"

static void collectDirtyNonTextDescendants(ABI24_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI24_0_0RCTShadowView *child in shadowView.ReactABI24_0_0Subviews) {
    if ([child isKindOfClass:[ABI24_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI24_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI24_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI24_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI24_0_0YGMeasureMode)widthMode;

@end


@implementation ABI24_0_0RCTTextManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI24_0_0RCTText new];
}

- (ABI24_0_0RCTShadowView *)shadowView
{
  return [ABI24_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI24_0_0RCTTextDecorationLineType)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)
ABI24_0_0RCT_EXPORT_SHADOW_PROPERTY(selectable, BOOL)

- (ABI24_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI24_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI24_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI24_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI24_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI24_0_0RCTShadowView *shadowView = queue[i];
      ABI24_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI24_0_0RCTShadowText class]]) {
        ((ABI24_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI24_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI24_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI24_0_0RCTShadowRawText class]]) {
        ABI24_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI24_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI24_0_0RCTShadowView *child in [shadowView ReactABI24_0_0Subviews]) {
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

- (ABI24_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI24_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI24_0_0Tag = shadowView.ReactABI24_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI24_0_0RCTText *> *viewRegistry) {
    ABI24_0_0RCTText *text = viewRegistry[ReactABI24_0_0Tag];
    text.contentInset = padding;
  };
}

@end
