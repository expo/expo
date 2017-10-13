/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTTextManager.h"

#import <ReactABI22_0_0/ABI22_0_0RCTAccessibilityManager.h>
#import <ReactABI22_0_0/ABI22_0_0RCTAssert.h>
#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>
#import <ReactABI22_0_0/ABI22_0_0RCTLog.h>
#import <ReactABI22_0_0/ABI22_0_0RCTShadowView+Layout.h>
#import <ReactABI22_0_0/UIView+ReactABI22_0_0.h>
#import <yogaABI22_0_0/ABI22_0_0Yoga.h>

#import "ABI22_0_0RCTShadowRawText.h"
#import "ABI22_0_0RCTShadowText.h"
#import "ABI22_0_0RCTText.h"
#import "ABI22_0_0RCTTextView.h"

static void collectDirtyNonTextDescendants(ABI22_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI22_0_0RCTShadowView *child in shadowView.ReactABI22_0_0Subviews) {
    if ([child isKindOfClass:[ABI22_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI22_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI22_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI22_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI22_0_0YGMeasureMode)widthMode;

@end


@implementation ABI22_0_0RCTTextManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI22_0_0RCTText new];
}

- (ABI22_0_0RCTShadowView *)shadowView
{
  return [ABI22_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI22_0_0RCTTextDecorationLineType)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)
ABI22_0_0RCT_EXPORT_SHADOW_PROPERTY(selectable, BOOL)

- (ABI22_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI22_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI22_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI22_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI22_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI22_0_0RCTShadowView *shadowView = queue[i];
      ABI22_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI22_0_0RCTShadowText class]]) {
        ((ABI22_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI22_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI22_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI22_0_0RCTShadowRawText class]]) {
        ABI22_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI22_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI22_0_0RCTShadowView *child in [shadowView ReactABI22_0_0Subviews]) {
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

- (ABI22_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI22_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI22_0_0Tag = shadowView.ReactABI22_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI22_0_0RCTText *> *viewRegistry) {
    ABI22_0_0RCTText *text = viewRegistry[ReactABI22_0_0Tag];
    text.contentInset = padding;
  };
}

@end
