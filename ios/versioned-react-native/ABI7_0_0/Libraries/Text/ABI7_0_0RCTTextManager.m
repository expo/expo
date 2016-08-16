/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTTextManager.h"

#import "ABI7_0_0Layout.h"
#import "ABI7_0_0RCTAccessibilityManager.h"
#import "ABI7_0_0RCTAssert.h"
#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTLog.h"
#import "ABI7_0_0RCTShadowRawText.h"
#import "ABI7_0_0RCTShadowText.h"
#import "ABI7_0_0RCTText.h"
#import "ABI7_0_0RCTTextView.h"
#import "UIView+ReactABI7_0_0.h"

static void collectDirtyNonTextDescendants(ABI7_0_0RCTShadowText *shadowView, NSMutableArray *nonTextDescendants) {
  for (ABI7_0_0RCTShadowView *child in shadowView.ReactABI7_0_0Subviews) {
    if ([child isKindOfClass:[ABI7_0_0RCTShadowText class]]) {
      collectDirtyNonTextDescendants((ABI7_0_0RCTShadowText *)child, nonTextDescendants);
    } else if ([child isKindOfClass:[ABI7_0_0RCTShadowRawText class]]) {
      // no-op
    } else if ([child isTextDirty]) {
      [nonTextDescendants addObject:child];
    }
  }
}

@interface ABI7_0_0RCTShadowText (Private)

- (NSTextStorage *)buildTextStorageForWidth:(CGFloat)width widthMode:(css_measure_mode_t)widthMode;

@end


@implementation ABI7_0_0RCTTextManager

ABI7_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI7_0_0RCTText new];
}

- (ABI7_0_0RCTShadowView *)shadowView
{
  return [ABI7_0_0RCTShadowText new];
}

#pragma mark - Shadow properties

ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationStyle, NSUnderlineStyle)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationColor, UIColor)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(textDecorationLine, ABI7_0_0RCTTextDecorationLineType)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(allowFontScaling, BOOL)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(opacity, CGFloat)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowOffset, CGSize)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowRadius, CGFloat)
ABI7_0_0RCT_EXPORT_SHADOW_PROPERTY(textShadowColor, UIColor)

- (ABI7_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI7_0_0RCTShadowView *> *)shadowViewRegistry
{
  NSMutableSet *textViewTagsToUpdate = [NSMutableSet new];
  for (ABI7_0_0RCTShadowView *rootView in shadowViewRegistry.allValues) {
    if (![rootView isReactABI7_0_0RootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    NSMutableArray<ABI7_0_0RCTShadowView *> *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < queue.count; i++) {
      ABI7_0_0RCTShadowView *shadowView = queue[i];
      ABI7_0_0RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[ABI7_0_0RCTShadowText class]]) {
        ((ABI7_0_0RCTShadowText *)shadowView).fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
        [(ABI7_0_0RCTShadowText *)shadowView recomputeText];
        collectDirtyNonTextDescendants((ABI7_0_0RCTShadowText *)shadowView, queue);
      } else if ([shadowView isKindOfClass:[ABI7_0_0RCTShadowRawText class]]) {
        ABI7_0_0RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(ABI7_0_0RCTShadowRawText *)shadowView text]);
      } else {
        NSNumber *ReactABI7_0_0Tag = shadowView.ReactABI7_0_0Tag;
        // This isn't pretty, but hopefully it's temporary
        // the problem is, there's no easy way (besides the viewName)
        // to tell from the shadowView if the view is an RKTextView
        if ([shadowView.viewName hasSuffix:@"TextView"]) {
          // Add to textViewTagsToUpdate only if has a ABI7_0_0RCTShadowText subview
          for (ABI7_0_0RCTShadowView *subview in shadowView.ReactABI7_0_0Subviews) {
            if ([subview isKindOfClass:[ABI7_0_0RCTShadowText class]]) {
              [textViewTagsToUpdate addObject:ReactABI7_0_0Tag];
              break;
            }
          }
        }
        for (ABI7_0_0RCTShadowView *child in [shadowView ReactABI7_0_0Subviews]) {
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
   * `<TextInput>` controls. It is required in order to ensure that the
   * textStorage (aka attributed string) is copied over from the ABI7_0_0RCTShadowText
   * to the ABI7_0_0RCTText view in time to be used to update the editable text content.
   */
  if (textViewTagsToUpdate.count) {

    NSMutableArray<ABI7_0_0RCTViewManagerUIBlock> *uiBlocks = [NSMutableArray new];
    for (NSNumber *ReactABI7_0_0Tag in textViewTagsToUpdate) {
      ABI7_0_0RCTShadowView *shadowTextView = shadowViewRegistry[ReactABI7_0_0Tag];
      ABI7_0_0RCTShadowText *shadowText;
      for (ABI7_0_0RCTShadowText *subview in shadowTextView.ReactABI7_0_0Subviews) {
        if ([subview isKindOfClass:[ABI7_0_0RCTShadowText class]]) {
          shadowText = subview;
          break;
        }
      }

      UIEdgeInsets padding = shadowText.paddingAsInsets;
      CGFloat width = shadowText.frame.size.width - (padding.left + padding.right);

      NSTextStorage *textStorage = [shadowText buildTextStorageForWidth:width widthMode:CSS_MEASURE_MODE_EXACTLY];
      [uiBlocks addObject:^(ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI7_0_0RCTTextView *> *viewRegistry) {
        ABI7_0_0RCTTextView *textView = viewRegistry[ReactABI7_0_0Tag];
        ABI7_0_0RCTText *text;
        for (ABI7_0_0RCTText *subview in textView.ReactABI7_0_0Subviews) {
          if ([subview isKindOfClass:[ABI7_0_0RCTText class]]) {
            text = subview;
            break;
          }
        }

        text.textStorage = textStorage;
        [textView performTextUpdate];
      }];
    }

    return ^(ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
      for (ABI7_0_0RCTViewManagerUIBlock uiBlock in uiBlocks) {
        uiBlock(uiManager, viewRegistry);
      }
    };
  } else {
    return nil;
  }
}

- (ABI7_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(ABI7_0_0RCTShadowText *)shadowView
{
  NSNumber *ReactABI7_0_0Tag = shadowView.ReactABI7_0_0Tag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI7_0_0RCTText *> *viewRegistry) {
    ABI7_0_0RCTText *text = viewRegistry[ReactABI7_0_0Tag];
    text.contentInset = padding;
  };
}

@end
