/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTBaseTextShadowView.h>

#import <ABI40_0_0React/ABI40_0_0RCTShadowView+Layout.h>

#import <ABI40_0_0React/ABI40_0_0RCTRawTextShadowView.h>
#import <ABI40_0_0React/ABI40_0_0RCTVirtualTextShadowView.h>

NSString *const ABI40_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName = @"ABI40_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName";

static void ABI40_0_0RCTInlineViewYogaNodeDirtied(ABI40_0_0YGNodeRef node)
{
  // An inline view (a view nested inside of a text node) does not have a parent
  // in the Yoga tree. Consequently, we have to manually propagate the inline
  // view's dirty signal up through the text nodes. At some point, it'll reach
  // the outermost text node which has a Yoga node and then Yoga will take over
  // the dirty signal propagation.
  ABI40_0_0RCTShadowView *inlineView = (__bridge ABI40_0_0RCTShadowView *)ABI40_0_0YGNodeGetContext(node);
  ABI40_0_0RCTBaseTextShadowView *baseTextShadowView =
    (ABI40_0_0RCTBaseTextShadowView *)inlineView.ABI40_0_0ReactSuperview;
  
  [baseTextShadowView dirtyLayout];
}

@implementation ABI40_0_0RCTBaseTextShadowView

- (instancetype)init
{
  if (self = [super init]) {
    _textAttributes = [ABI40_0_0RCTTextAttributes new];
  }

  return self;
}

- (void)setABI40_0_0ReactTag:(NSNumber *)ABI40_0_0ReactTag
{
  [super setABI40_0_0ReactTag:ABI40_0_0ReactTag];
  _textAttributes.tag = ABI40_0_0ReactTag;
}

#pragma mark - Life Cycle

- (void)insertABI40_0_0ReactSubview:(ABI40_0_0RCTShadowView *)subview atIndex:(NSInteger)index
{
  [super insertABI40_0_0ReactSubview:subview atIndex:index];
  
  [self dirtyLayout];
  
  if (![subview isKindOfClass:[ABI40_0_0RCTVirtualTextShadowView class]]) {
    ABI40_0_0YGNodeSetDirtiedFunc(subview.yogaNode, ABI40_0_0RCTInlineViewYogaNodeDirtied);
  }
}

- (void)removeABI40_0_0ReactSubview:(ABI40_0_0RCTShadowView *)subview
{
  if (![subview isKindOfClass:[ABI40_0_0RCTVirtualTextShadowView class]]) {
    ABI40_0_0YGNodeSetDirtiedFunc(subview.yogaNode, NULL);
  }
  
  [self dirtyLayout];
  
  [super removeABI40_0_0ReactSubview:subview];
}

#pragma mark - attributedString

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI40_0_0RCTTextAttributes *)baseTextAttributes
{
  ABI40_0_0RCTTextAttributes *textAttributes;

  if (baseTextAttributes) {
    textAttributes = [baseTextAttributes copy];
    [textAttributes applyTextAttributes:self.textAttributes];
  } else {
    textAttributes = [self.textAttributes copy];
  }

  if (cachedAttributedText && [cachedTextAttributes isEqual:textAttributes]) {
    return cachedAttributedText;
  }

  NSMutableAttributedString *attributedText = [NSMutableAttributedString new];

  [attributedText beginEditing];

  for (ABI40_0_0RCTShadowView *shadowView in self.ABI40_0_0ReactSubviews) {
    // Special Case: ABI40_0_0RCTRawTextShadowView
    if ([shadowView isKindOfClass:[ABI40_0_0RCTRawTextShadowView class]]) {
      ABI40_0_0RCTRawTextShadowView *rawTextShadowView = (ABI40_0_0RCTRawTextShadowView *)shadowView;
      NSString *text = rawTextShadowView.text;
      if (text) {
        NSAttributedString *rawTextAttributedString =
          [[NSAttributedString alloc] initWithString:[textAttributes applyTextAttributesToText:text]
                                          attributes:textAttributes.effectiveTextAttributes];
        [attributedText appendAttributedString:rawTextAttributedString];
      }
      continue;
    }

    // Special Case: ABI40_0_0RCTBaseTextShadowView
    if ([shadowView isKindOfClass:[ABI40_0_0RCTBaseTextShadowView class]]) {
      ABI40_0_0RCTBaseTextShadowView *baseTextShadowView = (ABI40_0_0RCTBaseTextShadowView *)shadowView;
      NSAttributedString *baseTextAttributedString =
        [baseTextShadowView attributedTextWithBaseTextAttributes:textAttributes];
      [attributedText appendAttributedString:baseTextAttributedString];
      continue;
    }

    // Generic Case: Any ABI40_0_0RCTShadowView
    NSTextAttachment *attachment = [NSTextAttachment new];
    NSMutableAttributedString *embeddedShadowViewAttributedString = [NSMutableAttributedString new];
    [embeddedShadowViewAttributedString beginEditing];
    [embeddedShadowViewAttributedString appendAttributedString:[NSAttributedString attributedStringWithAttachment:attachment]];
    [embeddedShadowViewAttributedString addAttribute:ABI40_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
                                               value:shadowView
                                               range:(NSRange){0, embeddedShadowViewAttributedString.length}];
    [embeddedShadowViewAttributedString endEditing];
    [attributedText appendAttributedString:embeddedShadowViewAttributedString];
  }

  [attributedText endEditing];

  [self clearLayout];

  cachedAttributedText = [attributedText copy];
  cachedTextAttributes = textAttributes;

  return cachedAttributedText;
}

- (void)dirtyLayout
{
  [super dirtyLayout];
  cachedAttributedText = nil;
  cachedTextAttributes = nil;
}

- (void)didUpdateABI40_0_0ReactSubviews
{
  [super didUpdateABI40_0_0ReactSubviews];
  [self dirtyLayout];
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];
  [self dirtyLayout];
}

@end
