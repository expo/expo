/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTTextManager.h"

#import <ReactABI18_0_0/ABI18_0_0RCTAccessibilityManager.h>
#import <ReactABI18_0_0/ABI18_0_0RCTAssert.h>
#import <ReactABI18_0_0/ABI18_0_0RCTConvert.h>
#import <ReactABI18_0_0/ABI18_0_0RCTLog.h>
#import <ReactABI18_0_0/ABI18_0_0RCTShadowView+Layout.h>
#import <ReactABI18_0_0/UIView+ReactABI18_0_0.h>
#import <YogaABI18_0_0/ABI18_0_0Yoga.h>

#import "ABI18_0_0RCTShadowRawText.h"
#import "ABI18_0_0RCTShadowText.h"
#import "ABI18_0_0RCTText.h"
#import "ABI18_0_0RCTTextView.h"

static void collectDirtyNonTextDescendants(ABI18_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI18_0_0RCTShadowView *child in shadowView.ReactABI18_0_0Subviews) {
    if ([child isKindOfClass:[ABI18_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI18_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI18_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI18_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI18_0_0YGMeasureMode)widthMode;

@end


@implementation ABI18_0_0RCTTextManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI18_0_0RCTText new];
}

- (ABI18_0_0RCTShadowView *)shadowView
{
  return [ABI18_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI18_0_0RCTTextDecorationLineType)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)
ABI18_0_0RCT_EXPORT_SHADOW_PROPERTY(selectable, BOOL)

- (ABI18_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI18_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI18_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI18_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI18_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI18_0_0RCTShadowView *shadowView = queue[i];
      ABI18_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI18_0_0RCTShadowText class]]) {
        ((ABI18_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI18_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI18_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI18_0_0RCTShadowRawText class]]) {
        ABI18_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI18_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI18_0_0RCTShadowView *child in [shadowView ReactABI18_0_0Subviews]) {
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

- (ABI18_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI18_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI18_0_0Tag = shadowView.ReactABI18_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI18_0_0RCTText *> *viewRegistry) {
    ABI18_0_0RCTText *text = viewRegistry[ReactABI18_0_0Tag];
    text.contentInset = padding;
  };
}

@end
