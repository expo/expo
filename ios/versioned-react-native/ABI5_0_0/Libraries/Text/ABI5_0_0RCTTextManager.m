/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTTextManager.h"

#import "ABI5_0_0Layout.h"
#import "ABI5_0_0RCTAccessibilityManager.h"
#import "ABI5_0_0RCTAssert.h"
#import "ABI5_0_0RCTConvert.h"
#import "ABI5_0_0RCTLog.h"
#import "ABI5_0_0RCTShadowRawText.h"
#import "ABI5_0_0RCTShadowText.h"
#import "ABI5_0_0RCTText.h"
#import "ABI5_0_0RCTTextView.h"
#import "UIView+ReactABI5_0_0.h"

@interface ABI5_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(css_measure_mode_t)widthMode;

@end


@implementation ABI5_0_0RCTTextManager

ABI5_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI5_0_0RCTText new];
}

- (ABI5_0_0RCTShadowView *)shadowView
{
  return [ABI5_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI5_0_0RCTTextDecorationLineType)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI5_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)

- (ABI5_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI5_0_0RCTShadowView *> *)shadowViewRegistry
{
  NSMutableSet *textViewTagsToUpdate = [NSMutableSet new];
  for (ABI5_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI5_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI5_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI5_0_0RCTShadowView *shadowView = queue[i];
      ABI5_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI5_0_0RCTShadowText class]]) {
        ((ABI5_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI5_0_0RCTShadowText *)shadowView recomputeText];
      } else if ([shadowView isKindOfClass:[ABI5_0_0RCTShadowRawText class]]) {
        ABI5_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI5_0_0RCTShadowRawText *)shadowView text]);
      } else {
        NSNumber *ReactABI5_0_0Tag = shadowView.ReactABI5_0_0Tag;
        // This isn't pretty, but hopefully it's temporary
        // the problem is, there's no easy way (besides the viewName)
        // to tell from the shadowView if the view is an RKTextView
        if ([shadowView.viewName hasSuffix:@"TextView"]) {
          // Add to textViewTagsToUpdate only if has a ABI5_0_0RCTShadowText subview
          for (ABI5_0_0RCTShadowView *subview in shadowView.ReactABI5_0_0Subviews) {
            if ([subview isKindOfClass:[ABI5_0_0RCTShadowText class]]) {
              [textViewTagsToUpdate addObject:ReactABI5_0_0Tag];
              break;
            }
          }
        }
        for (ABI5_0_0RCTShadowView *child in [shadowView ReactABI5_0_0Subviews]) {
          if ([child isTextDirty]) {
            [queue addObject:child];
          }
        }
      }

      [shadowView setTextComputed];
    }
  }

  /**
   * NOTE: this logic is included to support rich text editing inside multiline
   * `<TextInput>` controls, a feature which is not yet supported in open source.
   * It is required in order to ensure that the textStorage (aka attributed
   * string) is copied over from the ABI5_0_0RCTShadowText to the ABI5_0_0RCTText view in time
   * to be used to update the editable text content.
   */
  if (textViewTagsToUpdate.count) {

    NSMutableArray<ABI5_0_0RCTViewManagerUIBlock> *uiBlocks = [NSMutableArray new];
    for (NSNumber *ReactABI5_0_0Tag in textViewTagsToUpdate) {
      ABI5_0_0RCTShadowView *shadowTextView = shadowViewRegistry[ReactABI5_0_0Tag];
      ABI5_0_0RCTShadowText *shadowText;
      for (ABI5_0_0RCTShadowText *subview in shadowTextView.ReactABI5_0_0Subviews) {
        if ([subview isKindOfClass:[ABI5_0_0RCTShadowText class]]) {
          shadowText = subview;
          break;
        }
      }

      UIEdgeInsets padding = shadowText.paddingAsInsets;
      CGFloat width = shadowText.frame.size.width - (padding.left + padding.right);
      NSTextStorage *textStorage = [shadowText buildTextStorageForWidth:width widthMode:CSS_MEASURE_MODE_EXACTLY];

      [uiBlocks addObject:^(ABI5_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI5_0_0RCTTextView *> *viewRegistry) {
        ABI5_0_0RCTTextView *textView = viewRegistry[ReactABI5_0_0Tag];
        ABI5_0_0RCTText *text;
        for (ABI5_0_0RCTText *subview in textView.ReactABI5_0_0Subviews) {
          if ([subview isKindOfClass:[ABI5_0_0RCTText class]]) {
            text = subview;
            break;
          }
        }

        text.textStorage = textStorage;
        [textView performTextUpdate];
      }];
    }

    return ^(ABI5_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      for (ABI5_0_0RCTViewManagerUIBlock uiBlock in uiBlocks) {
        uiBlock(uiManager, viewRegistry);
      }
    };
  } else {
    return nil;
  }
}

- (ABI5_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI5_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI5_0_0Tag = shadowView.ReactABI5_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI5_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI5_0_0RCTText *> *viewRegistry) {
    ABI5_0_0RCTText *text = viewRegistry[ReactABI5_0_0Tag];
    text.contentInset = padding;
  };
}

@end
