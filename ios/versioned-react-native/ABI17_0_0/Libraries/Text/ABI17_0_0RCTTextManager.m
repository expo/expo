/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTTextManager.h"

#import <YogaABI17_0_0/ABI17_0_0Yoga.h>
#import <ReactABI17_0_0/ABI17_0_0RCTAccessibilityManager.h>
#import <ReactABI17_0_0/ABI17_0_0RCTAssert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTConvert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTLog.h>
#import <ReactABI17_0_0/UIView+ReactABI17_0_0.h>

#import "ABI17_0_0RCTShadowRawText.h"
#import "ABI17_0_0RCTShadowText.h"
#import "ABI17_0_0RCTText.h"
#import "ABI17_0_0RCTTextView.h"

static void collectDirtyNonTextDescendants(ABI17_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI17_0_0RCTShadowView *child in shadowView.ReactABI17_0_0Subviews) {
    if ([child isKindOfClass:[ABI17_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI17_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI17_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI17_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI17_0_0YGMeasureMode)widthMode;

@end


@implementation ABI17_0_0RCTTextManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI17_0_0RCTText new];
}

- (ABI17_0_0RCTShadowView *)shadowView
{
  return [ABI17_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI17_0_0RCTTextDecorationLineType)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)
ABI17_0_0RCT_EXPORT_SHADOW_PROPERTY(selectable, BOOL)

- (ABI17_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI17_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI17_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI17_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI17_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI17_0_0RCTShadowView *shadowView = queue[i];
      ABI17_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI17_0_0RCTShadowText class]]) {
        ((ABI17_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI17_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI17_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI17_0_0RCTShadowRawText class]]) {
        ABI17_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI17_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI17_0_0RCTShadowView *child in [shadowView ReactABI17_0_0Subviews]) {
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

- (ABI17_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI17_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI17_0_0Tag = shadowView.ReactABI17_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI17_0_0RCTText *> *viewRegistry) {
    ABI17_0_0RCTText *text = viewRegistry[ReactABI17_0_0Tag];
    text.contentInset = padding;
  };
}

@end
