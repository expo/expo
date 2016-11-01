/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTTextManager.h"

//Internally we reference a separate library. See https://github.com/facebook/ReactABI11_0_0-native/pull/9544
#if __has_include(<CSSLayout/ABI11_0_0CSSLayout.h>)
#import <CSSLayout/ABI11_0_0CSSLayout.h>
#else
#import "ABI11_0_0CSSLayout.h"
#endif

#import "ABI11_0_0RCTAccessibilityManager.h"
#import "ABI11_0_0RCTAssert.h"
#import "ABI11_0_0RCTConvert.h"
#import "ABI11_0_0RCTLog.h"
#import "ABI11_0_0RCTShadowRawText.h"
#import "ABI11_0_0RCTShadowText.h"
#import "ABI11_0_0RCTText.h"
#import "ABI11_0_0RCTTextView.h"
#import "UIView+ReactABI11_0_0.h"

static void collectDirtyNonTextDescendants(ABI11_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI11_0_0RCTShadowView *child in shadowView.ReactABI11_0_0Subviews) {
    if ([child isKindOfClass:[ABI11_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI11_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI11_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI11_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI11_0_0CSSMeasureMode)widthMode;

@end


@implementation ABI11_0_0RCTTextManager

ABI11_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI11_0_0RCTText new];
}

- (ABI11_0_0RCTShadowView *)shadowView
{
  return [ABI11_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI11_0_0RCTTextDecorationLineType)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI11_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)

- (ABI11_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI11_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI11_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI11_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI11_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI11_0_0RCTShadowView *shadowView = queue[i];
      ABI11_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI11_0_0RCTShadowText class]]) {
        ((ABI11_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI11_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI11_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI11_0_0RCTShadowRawText class]]) {
        ABI11_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI11_0_0RCTShadowRawText *)shadowView text]);
      } else {
        for (ABI11_0_0RCTShadowView *child in [shadowView ReactABI11_0_0Subviews]) {
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

- (ABI11_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI11_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI11_0_0Tag = shadowView.ReactABI11_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI11_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI11_0_0RCTText *> *viewRegistry) {
    ABI11_0_0RCTText *text = viewRegistry[ReactABI11_0_0Tag];
    text.contentInset = padding;
  };
}

@end
