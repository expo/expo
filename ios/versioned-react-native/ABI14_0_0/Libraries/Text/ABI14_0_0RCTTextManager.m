/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0RCTTextManager.h"

#import <ABI14_0_0yoga/ABI14_0_0Yoga.h>
#import <ReactABI14_0_0/ABI14_0_0RCTAccessibilityManager.h>
#import <ReactABI14_0_0/ABI14_0_0RCTAssert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTLog.h>
#import <ReactABI14_0_0/UIView+ReactABI14_0_0.h>

#import "ABI14_0_0RCTShadowRawText.h"
#import "ABI14_0_0RCTShadowText.h"
#import "ABI14_0_0RCTText.h"
#import "ABI14_0_0RCTTextView.h"

static void collectDirtyNonTextDescendants(ABI14_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI14_0_0RCTShadowView *child in shadowView.ReactABI14_0_0Subviews) {
    if ([child isKindOfClass:[ABI14_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI14_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI14_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI14_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI14_0_0YGMeasureMode)widthMode;

@end


@implementation ABI14_0_0RCTTextManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI14_0_0RCTText new];
}

- (ABI14_0_0RCTShadowView *)shadowView
{
  return [ABI14_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI14_0_0RCTTextDecorationLineType)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)
ABI14_0_0RCT_EXPORT_SHADOW_PROPERTY(selectable, BOOL)

- (ABI14_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI14_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI14_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI14_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI14_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI14_0_0RCTShadowView *shadowView = queue[i];
      ABI14_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI14_0_0RCTShadowText class]]) {
        ((ABI14_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI14_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI14_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI14_0_0RCTShadowRawText class]]) {
        ABI14_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI14_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI14_0_0RCTShadowView *child in [shadowView ReactABI14_0_0Subviews]) {
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

- (ABI14_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI14_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI14_0_0Tag = shadowView.ReactABI14_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI14_0_0RCTText *> *viewRegistry) {
    ABI14_0_0RCTText *text = viewRegistry[ReactABI14_0_0Tag];
    text.contentInset = padding;
  };
}

@end
