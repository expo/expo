/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTTextManager.h"

#import <ReactABI20_0_0/ABI20_0_0RCTAccessibilityManager.h>
#import <ReactABI20_0_0/ABI20_0_0RCTAssert.h>
#import <ReactABI20_0_0/ABI20_0_0RCTConvert.h>
#import <ReactABI20_0_0/ABI20_0_0RCTLog.h>
#import <ReactABI20_0_0/ABI20_0_0RCTShadowView+Layout.h>
#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>
#import <YogaABI20_0_0/ABI20_0_0Yoga.h>

#import "ABI20_0_0RCTShadowRawText.h"
#import "ABI20_0_0RCTShadowText.h"
#import "ABI20_0_0RCTText.h"
#import "ABI20_0_0RCTTextView.h"

static void collectDirtyNonTextDescendants(ABI20_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI20_0_0RCTShadowView *child in shadowView.ReactABI20_0_0Subviews) {
    if ([child isKindOfClass:[ABI20_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI20_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI20_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI20_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI20_0_0YGMeasureMode)widthMode;

@end


@implementation ABI20_0_0RCTTextManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI20_0_0RCTText new];
}

- (ABI20_0_0RCTShadowView *)shadowView
{
  return [ABI20_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI20_0_0RCTTextDecorationLineType)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)
ABI20_0_0RCT_EXPORT_SHADOW_PROPERTY(selectable, BOOL)

- (ABI20_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI20_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI20_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI20_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI20_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI20_0_0RCTShadowView *shadowView = queue[i];
      ABI20_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI20_0_0RCTShadowText class]]) {
        ((ABI20_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI20_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI20_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI20_0_0RCTShadowRawText class]]) {
        ABI20_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI20_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI20_0_0RCTShadowView *child in [shadowView ReactABI20_0_0Subviews]) {
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

- (ABI20_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI20_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI20_0_0Tag = shadowView.ReactABI20_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI20_0_0RCTText *> *viewRegistry) {
    ABI20_0_0RCTText *text = viewRegistry[ReactABI20_0_0Tag];
    text.contentInset = padding;
  };
}

@end
