/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTTextManager.h"

#import <YogaABI16_0_0/ABI16_0_0Yoga.h>
#import <ReactABI16_0_0/ABI16_0_0RCTAccessibilityManager.h>
#import <ReactABI16_0_0/ABI16_0_0RCTAssert.h>
#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>
#import <ReactABI16_0_0/ABI16_0_0RCTLog.h>
#import <ReactABI16_0_0/UIView+ReactABI16_0_0.h>

#import "ABI16_0_0RCTShadowRawText.h"
#import "ABI16_0_0RCTShadowText.h"
#import "ABI16_0_0RCTText.h"
#import "ABI16_0_0RCTTextView.h"

static void collectDirtyNonTextDescendants(ABI16_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI16_0_0RCTShadowView *child in shadowView.ReactABI16_0_0Subviews) {
    if ([child isKindOfClass:[ABI16_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI16_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI16_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI16_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI16_0_0YGMeasureMode)widthMode;

@end


@implementation ABI16_0_0RCTTextManager

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI16_0_0RCTText new];
}

- (ABI16_0_0RCTShadowView *)shadowView
{
  return [ABI16_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI16_0_0RCTTextDecorationLineType)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)
ABI16_0_0RCT_EXPORT_SHADOW_PROPERTY(selectable, BOOL)

- (ABI16_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI16_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI16_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI16_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI16_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI16_0_0RCTShadowView *shadowView = queue[i];
      ABI16_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI16_0_0RCTShadowText class]]) {
        ((ABI16_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI16_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI16_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI16_0_0RCTShadowRawText class]]) {
        ABI16_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI16_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI16_0_0RCTShadowView *child in [shadowView ReactABI16_0_0Subviews]) {
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

- (ABI16_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI16_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI16_0_0Tag = shadowView.ReactABI16_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI16_0_0RCTText *> *viewRegistry) {
    ABI16_0_0RCTText *text = viewRegistry[ReactABI16_0_0Tag];
    text.contentInset = padding;
  };
}

@end
