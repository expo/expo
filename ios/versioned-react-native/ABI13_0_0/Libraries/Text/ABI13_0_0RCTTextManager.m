/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTTextManager.h"

#import <ABI13_0_0yoga/ABI13_0_0Yoga.h>
#import <ReactABI13_0_0/ABI13_0_0RCTAccessibilityManager.h>
#import <ReactABI13_0_0/ABI13_0_0RCTAssert.h>
#import <ReactABI13_0_0/ABI13_0_0RCTConvert.h>
#import <ReactABI13_0_0/ABI13_0_0RCTLog.h>
#import <ReactABI13_0_0/UIView+ReactABI13_0_0.h>

#import "ABI13_0_0RCTShadowRawText.h"
#import "ABI13_0_0RCTShadowText.h"
#import "ABI13_0_0RCTText.h"
#import "ABI13_0_0RCTTextView.h"

static void collectDirtyNonTextDescendants(ABI13_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI13_0_0RCTShadowView *child in shadowView.ReactABI13_0_0Subviews) {
    if ([child isKindOfClass:[ABI13_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI13_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI13_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI13_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI13_0_0YGMeasureMode)widthMode;

@end


@implementation ABI13_0_0RCTTextManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI13_0_0RCTText new];
}

- (ABI13_0_0RCTShadowView *)shadowView
{
  return [ABI13_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI13_0_0RCTTextDecorationLineType)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(selectable, BOOL)

- (ABI13_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI13_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI13_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI13_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI13_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI13_0_0RCTShadowView *shadowView = queue[i];
      ABI13_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI13_0_0RCTShadowText class]]) {
        ((ABI13_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI13_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI13_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI13_0_0RCTShadowRawText class]]) {
        ABI13_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI13_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI13_0_0RCTShadowView *child in [shadowView ReactABI13_0_0Subviews]) {
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

- (ABI13_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI13_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI13_0_0Tag = shadowView.ReactABI13_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI13_0_0RCTText *> *viewRegistry) {
    ABI13_0_0RCTText *text = viewRegistry[ReactABI13_0_0Tag];
    text.contentInset = padding;
  };
}

@end
