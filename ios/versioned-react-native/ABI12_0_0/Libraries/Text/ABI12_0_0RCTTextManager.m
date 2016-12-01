/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTTextManager.h"

//Internally we reference a separate library. See https://github.com/facebook/ReactABI12_0_0-native/pull/9544
#if __has_include(<CSSLayout/ABI12_0_0CSSLayout.h>)
#import <CSSLayout/ABI12_0_0CSSLayout.h>
#else
#import "ABI12_0_0CSSLayout.h"
#endif

#import "ABI12_0_0RCTAccessibilityManager.h"
#import "ABI12_0_0RCTAssert.h"
#import "ABI12_0_0RCTConvert.h"
#import "ABI12_0_0RCTLog.h"
#import "ABI12_0_0RCTShadowRawText.h"
#import "ABI12_0_0RCTShadowText.h"
#import "ABI12_0_0RCTText.h"
#import "ABI12_0_0RCTTextView.h"
#import "UIView+ReactABI12_0_0.h"

static void collectDirtyNonTextDescendants(ABI12_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI12_0_0RCTShadowView *child in shadowView.ReactABI12_0_0Subviews) {
    if ([child isKindOfClass:[ABI12_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI12_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI12_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI12_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI12_0_0CSSMeasureMode)widthMode;

@end


@implementation ABI12_0_0RCTTextManager

ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI12_0_0RCTText new];
}

- (ABI12_0_0RCTShadowView *)shadowView
{
  return [ABI12_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI12_0_0RCTTextDecorationLineType)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI12_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)

- (ABI12_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI12_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI12_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI12_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI12_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI12_0_0RCTShadowView *shadowView = queue[i];
      ABI12_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI12_0_0RCTShadowText class]]) {
        ((ABI12_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI12_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI12_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI12_0_0RCTShadowRawText class]]) {
        ABI12_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI12_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI12_0_0RCTShadowView *child in [shadowView ReactABI12_0_0Subviews]) {
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

- (ABI12_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI12_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI12_0_0Tag = shadowView.ReactABI12_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI12_0_0RCTText *> *viewRegistry) {
    ABI12_0_0RCTText *text = viewRegistry[ReactABI12_0_0Tag];
    text.contentInset = padding;
  };
}

@end
