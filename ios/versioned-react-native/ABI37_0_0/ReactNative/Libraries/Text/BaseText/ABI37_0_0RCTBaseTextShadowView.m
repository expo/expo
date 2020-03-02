/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTBaseTextShadowView.h>

#import <ABI37_0_0React/ABI37_0_0RCTShadowView+Layout.h>

#import <ABI37_0_0React/ABI37_0_0RCTRawTextShadowView.h>
#import <ABI37_0_0React/ABI37_0_0RCTVirtualTextShadowView.h>

NSString *const ABI37_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName = @"ABI37_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName";

static void ABI37_0_0RCTInlineViewYogaNodeDirtied(ABI37_0_0YGNodeRef node)
{
  // An inline view (a view nested inside of a text node) does not have a parent
  // in the Yoga tree. Consequently, we have to manually propagate the inline
  // view's dirty signal up through the text nodes. At some point, it'll reach
  // the outermost text node which has a Yoga node and then Yoga will take over
  // the dirty signal propagation.
  ABI37_0_0RCTShadowView *inlineView = (__bridge ABI37_0_0RCTShadowView *)ABI37_0_0YGNodeGetContext(node);
  ABI37_0_0RCTBaseTextShadowView *baseTextShadowView =
    (ABI37_0_0RCTBaseTextShadowView *)inlineView.ABI37_0_0ReactSuperview;
  
  [baseTextShadowView dirtyLayout];
}

@implementation ABI37_0_0RCTBaseTextShadowView

- (instancetype)init
{
  if (self = [super init]) {
    _textAttributes = [ABI37_0_0RCTTextAttributes new];
  }

  return self;
}

- (void)setABI37_0_0ReactTag:(NSNumber *)ABI37_0_0ReactTag
{
  [super setABI37_0_0ReactTag:ABI37_0_0ReactTag];
  _textAttributes.tag = ABI37_0_0ReactTag;
}

#pragma mark - Life Cycle

- (void)insertABI37_0_0ReactSubview:(ABI37_0_0RCTShadowView *)subview atIndex:(NSInteger)index
{
  [super insertABI37_0_0ReactSubview:subview atIndex:index];
  
  [self dirtyLayout];
  
  if (![subview isKindOfClass:[ABI37_0_0RCTVirtualTextShadowView class]]) {
    ABI37_0_0YGNodeSetDirtiedFunc(subview.yogaNode, ABI37_0_0RCTInlineViewYogaNodeDirtied);
  }
}

- (void)removeABI37_0_0ReactSubview:(ABI37_0_0RCTShadowView *)subview
{
  if (![subview isKindOfClass:[ABI37_0_0RCTVirtualTextShadowView class]]) {
    ABI37_0_0YGNodeSetDirtiedFunc(subview.yogaNode, NULL);
  }
  
  [self dirtyLayout];
  
  [super removeABI37_0_0ReactSubview:subview];
}

#pragma mark - attributedString

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI37_0_0RCTTextAttributes *)baseTextAttributes
{
  ABI37_0_0RCTTextAttributes *textAttributes;

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

  for (ABI37_0_0RCTShadowView *shadowView in self.ABI37_0_0ReactSubviews) {
    // Special Case: ABI37_0_0RCTRawTextShadowView
    if ([shadowView isKindOfClass:[ABI37_0_0RCTRawTextShadowView class]]) {
      ABI37_0_0RCTRawTextShadowView *rawTextShadowView = (ABI37_0_0RCTRawTextShadowView *)shadowView;
      NSString *text = rawTextShadowView.text;
      if (text) {
        NSAttributedString *rawTextAttributedString =
          [[NSAttributedString alloc] initWithString:[textAttributes applyTextAttributesToText:text]
                                          attributes:textAttributes.effectiveTextAttributes];
        [attributedText appendAttributedString:rawTextAttributedString];
      }
      continue;
    }

    // Special Case: ABI37_0_0RCTBaseTextShadowView
    if ([shadowView isKindOfClass:[ABI37_0_0RCTBaseTextShadowView class]]) {
      ABI37_0_0RCTBaseTextShadowView *baseTextShadowView = (ABI37_0_0RCTBaseTextShadowView *)shadowView;
      NSAttributedString *baseTextAttributedString =
        [baseTextShadowView attributedTextWithBaseTextAttributes:textAttributes];
      [attributedText appendAttributedString:baseTextAttributedString];
      continue;
    }

    // Generic Case: Any ABI37_0_0RCTShadowView
    NSTextAttachment *attachment = [NSTextAttachment new];
    NSMutableAttributedString *embeddedShadowViewAttributedString = [NSMutableAttributedString new];
    [embeddedShadowViewAttributedString beginEditing];
    [embeddedShadowViewAttributedString appendAttributedString:[NSAttributedString attributedStringWithAttachment:attachment]];
    [embeddedShadowViewAttributedString addAttribute:ABI37_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
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

- (void)didUpdateABI37_0_0ReactSubviews
{
  [super didUpdateABI37_0_0ReactSubviews];
  [self dirtyLayout];
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];
  [self dirtyLayout];
}

@end
