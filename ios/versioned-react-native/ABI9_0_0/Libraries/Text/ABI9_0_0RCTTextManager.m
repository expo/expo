/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTTextManager.h"

#import <CSSLayout/ABI9_0_0CSSLayout.h>
#import "ABI9_0_0RCTAccessibilityManager.h"
#import "ABI9_0_0RCTAssert.h"
#import "ABI9_0_0RCTConvert.h"
#import "ABI9_0_0RCTLog.h"
#import "ABI9_0_0RCTShadowRawText.h"
#import "ABI9_0_0RCTShadowText.h"
#import "ABI9_0_0RCTText.h"
#import "ABI9_0_0RCTTextView.h"
#import "UIView+ReactABI9_0_0.h"

static void collectDirtyNonTextDescendants(ABI9_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI9_0_0RCTShadowView *child in shadowView.ReactABI9_0_0Subviews) {
    if ([child isKindOfClass:[ABI9_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI9_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI9_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI9_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI9_0_0CSSMeasureMode)widthMode;

@end


@implementation ABI9_0_0RCTTextManager

ABI9_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI9_0_0RCTText new];
}

- (ABI9_0_0RCTShadowView *)shadowView
{
  return [ABI9_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI9_0_0RCTTextDecorationLineType)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)

- (ABI9_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI9_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI9_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI9_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI9_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI9_0_0RCTShadowView *shadowView = queue[i];
      ABI9_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI9_0_0RCTShadowText class]]) {
        ((ABI9_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI9_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI9_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI9_0_0RCTShadowRawText class]]) {
        ABI9_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI9_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI9_0_0RCTShadowView *child in [shadowView ReactABI9_0_0Subviews]) {
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

- (ABI9_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI9_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI9_0_0Tag = shadowView.ReactABI9_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI9_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI9_0_0RCTText *> *viewRegistry) {
    ABI9_0_0RCTText *text = viewRegistry[ReactABI9_0_0Tag];
    text.contentInset = padding;
  };
}

@end
