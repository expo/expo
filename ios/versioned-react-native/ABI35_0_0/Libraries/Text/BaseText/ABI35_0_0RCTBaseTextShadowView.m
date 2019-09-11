/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTBaseTextShadowView.h"

#import <ReactABI35_0_0/ABI35_0_0RCTShadowView+Layout.h>

#import "ABI35_0_0RCTRawTextShadowView.h"
#import "ABI35_0_0RCTVirtualTextShadowView.h"

NSString *const ABI35_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName = @"ABI35_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName";

static void ABI35_0_0RCTInlineViewYogaNodeDirtied(ABI35_0_0YGNodeRef node)
{
  // An inline view (a view nested inside of a text node) does not have a parent
  // in the Yoga tree. Consequently, we have to manually propagate the inline
  // view's dirty signal up through the text nodes. At some point, it'll reach
  // the outermost text node which has a Yoga node and then Yoga will take over
  // the dirty signal propagation.
  ABI35_0_0RCTShadowView *inlineView = (__bridge ABI35_0_0RCTShadowView *)ABI35_0_0YGNodeGetContext(node);
  ABI35_0_0RCTBaseTextShadowView *baseTextShadowView =
    (ABI35_0_0RCTBaseTextShadowView *)inlineView.ReactABI35_0_0Superview;
  
  [baseTextShadowView dirtyLayout];
}

@implementation ABI35_0_0RCTBaseTextShadowView
{
  NSAttributedString *_Nullable _cachedAttributedText;
  ABI35_0_0RCTTextAttributes *_Nullable _cachedTextAttributes;
}

- (instancetype)init
{
  if (self = [super init]) {
    _textAttributes = [ABI35_0_0RCTTextAttributes new];
  }

  return self;
}

- (void)setReactABI35_0_0Tag:(NSNumber *)ReactABI35_0_0Tag
{
  [super setReactABI35_0_0Tag:ReactABI35_0_0Tag];
  _textAttributes.tag = ReactABI35_0_0Tag;
}

#pragma mark - Life Cycle

- (void)insertReactABI35_0_0Subview:(ABI35_0_0RCTShadowView *)subview atIndex:(NSInteger)index
{
  [super insertReactABI35_0_0Subview:subview atIndex:index];
  
  [self dirtyLayout];
  
  if (![subview isKindOfClass:[ABI35_0_0RCTVirtualTextShadowView class]]) {
    ABI35_0_0YGNodeSetDirtiedFunc(subview.ABI35_0_0yogaNode, ABI35_0_0RCTInlineViewYogaNodeDirtied);
  }
}

- (void)removeReactABI35_0_0Subview:(ABI35_0_0RCTShadowView *)subview
{
  if (![subview isKindOfClass:[ABI35_0_0RCTVirtualTextShadowView class]]) {
    ABI35_0_0YGNodeSetDirtiedFunc(subview.ABI35_0_0yogaNode, NULL);
  }
  
  [self dirtyLayout];
  
  [super removeReactABI35_0_0Subview:subview];
}

#pragma mark - attributedString

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI35_0_0RCTTextAttributes *)baseTextAttributes
{
  ABI35_0_0RCTTextAttributes *textAttributes;

  if (baseTextAttributes) {
    textAttributes = [baseTextAttributes copy];
    [textAttributes applyTextAttributes:self.textAttributes];
  } else {
    textAttributes = [self.textAttributes copy];
  }

  if (_cachedAttributedText && [_cachedTextAttributes isEqual:textAttributes]) {
    return _cachedAttributedText;
  }

  NSMutableAttributedString *attributedText = [NSMutableAttributedString new];

  [attributedText beginEditing];

  for (ABI35_0_0RCTShadowView *shadowView in self.ReactABI35_0_0Subviews) {
    // Special Case: ABI35_0_0RCTRawTextShadowView
    if ([shadowView isKindOfClass:[ABI35_0_0RCTRawTextShadowView class]]) {
      ABI35_0_0RCTRawTextShadowView *rawTextShadowView = (ABI35_0_0RCTRawTextShadowView *)shadowView;
      NSString *text = rawTextShadowView.text;
      if (text) {
        NSAttributedString *rawTextAttributedString =
          [[NSAttributedString alloc] initWithString:[textAttributes applyTextAttributesToText:text]
                                          attributes:textAttributes.effectiveTextAttributes];
        [attributedText appendAttributedString:rawTextAttributedString];
      }
      continue;
    }

    // Special Case: ABI35_0_0RCTBaseTextShadowView
    if ([shadowView isKindOfClass:[ABI35_0_0RCTBaseTextShadowView class]]) {
      ABI35_0_0RCTBaseTextShadowView *baseTextShadowView = (ABI35_0_0RCTBaseTextShadowView *)shadowView;
      NSAttributedString *baseTextAttributedString =
        [baseTextShadowView attributedTextWithBaseTextAttributes:textAttributes];
      [attributedText appendAttributedString:baseTextAttributedString];
      continue;
    }

    // Generic Case: Any ABI35_0_0RCTShadowView
    NSTextAttachment *attachment = [NSTextAttachment new];
    NSMutableAttributedString *embeddedShadowViewAttributedString = [NSMutableAttributedString new];
    [embeddedShadowViewAttributedString beginEditing];
    [embeddedShadowViewAttributedString appendAttributedString:[NSAttributedString attributedStringWithAttachment:attachment]];
    [embeddedShadowViewAttributedString addAttribute:ABI35_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                                               value:shadowView
                                               range:(NSRange){0, embeddedShadowViewAttributedString.length}];
    [embeddedShadowViewAttributedString endEditing];
    [attributedText appendAttributedString:embeddedShadowViewAttributedString];
  }

  [attributedText endEditing];

  [self clearLayout];

  _cachedAttributedText = [attributedText copy];
  _cachedTextAttributes = textAttributes;

  return _cachedAttributedText;
}

- (void)dirtyLayout
{
  [super dirtyLayout];
  _cachedAttributedText = nil;
  _cachedTextAttributes = nil;
}

- (void)didUpdateReactABI35_0_0Subviews
{
  [super didUpdateReactABI35_0_0Subviews];
  [self dirtyLayout];
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];
  [self dirtyLayout];
}

@end
