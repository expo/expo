/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTTextViewManager.h"

#import <ReactABI26_0_0/ABI26_0_0RCTAccessibilityManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTAssert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTLog.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView+Layout.h>
#import <ReactABI26_0_0/UIView+ReactABI26_0_0.h>
#import <YogaABI26_0_0/ABI26_0_0Yoga.h>

#import "ABI26_0_0RCTRawTextShadowView.h"
#import "ABI26_0_0RCTTextShadowView.h"
#import "ABI26_0_0RCTTextView.h"
#import "ABI26_0_0RCTMultilineTextInputView.h"

static void collectDirtyNonTextDescendants(ABI26_0_0RCTTextShadowView *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI26_0_0RCTShadowView *child in shadowView.ReactABI26_0_0Subviews) {
    if ([child isKindOfClass:[ABI26_0_0RCTTextShadowView class]]) {
      collectDirtyNonTextDescendants((ABI26_0_0RCTTextShadowView *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI26_0_0RCTRawTextShadowView class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI26_0_0RCTTextShadowView (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(ABI26_0_0YGMeasureMode)widthMode;

@end


@implementation ABI26_0_0RCTTextViewManager

ABI26_0_0RCT_EXPORT_MODULE(ABI26_0_0RCTText)

- (UIView *)view
{
  return [ABI26_0_0RCTTextView new];
}

- (ABI26_0_0RCTShadowView *)shadowView
{
  return [ABI26_0_0RCTTextShadowView new];
}

#pragma mark - Shadow properties

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(fontVariant, NSArray)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(ellipsizeMode, NSLineBreakMode)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI26_0_0RCTTextDecorationLineType)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(adjustsFontSizeToFit, BOOL)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(minimumFontScale, CGFloat)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(selectable, BOOL)

- (ABI26_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI26_0_0RCTShadowView *> *)shadowViewRegistry
{
  for (ABI26_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI26_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI26_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI26_0_0RCTShadowView *shadowView = queue[i];
      ABI26_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI26_0_0RCTTextShadowView class]]) {
        ((ABI26_0_0RCTTextShadowView *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI26_0_0RCTTextShadowView *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI26_0_0RCTTextShadowView *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI26_0_0RCTRawTextShadowView class]]) {
        ABI26_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI26_0_0RCTRawTextShadowView *)shadowView text]);
      } else {
        for (ABI26_0_0RCTShadowView *child in [shadowView ReactABI26_0_0Subviews]) {
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

- (ABI26_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI26_0_0RCTTextShadowView *)shadowView
{
  NSNumber *ReactABI26_0_0Tag = shadowView.ReactABI26_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI26_0_0RCTTextView *> *viewRegistry) {
    ABI26_0_0RCTTextView *text = viewRegistry[ReactABI26_0_0Tag];
    text.contentInset = padding;
  };
}

@end
