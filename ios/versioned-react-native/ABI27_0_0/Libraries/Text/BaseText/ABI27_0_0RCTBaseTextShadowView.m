/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTBaseTextShadowView.h"

#import <ReactABI27_0_0/ABI27_0_0RCTShadowView+Layout.h>

#import "ABI27_0_0RCTRawTextShadowView.h"
#import "ABI27_0_0RCTVirtualTextShadowView.h"

NSString *const ABI27_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName = @"ABI27_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName";

@implementation ABI27_0_0RCTBaseTextShadowView
{
  NSAttributedString *_Nullable _cachedAttributedText;
  ABI27_0_0RCTTextAttributes *_Nullable _cachedTextAttributes;
}

- (instancetype)init
{
  if (self = [super init]) {
    _textAttributes = [ABI27_0_0RCTTextAttributes new];
  }

  return self;
}

- (void)setReactABI27_0_0Tag:(NSNumber *)ReactABI27_0_0Tag
{
  [super setReactABI27_0_0Tag:ReactABI27_0_0Tag];
  _textAttributes.tag = ReactABI27_0_0Tag;
}

#pragma mark - attributedString

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI27_0_0RCTTextAttributes *)baseTextAttributes
{
  ABI27_0_0RCTTextAttributes *textAttributes;

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

  for (ABI27_0_0RCTShadowView *shadowView in self.ReactABI27_0_0Subviews) {
    // Special Case: ABI27_0_0RCTRawTextShadowView
    if ([shadowView isKindOfClass:[ABI27_0_0RCTRawTextShadowView class]]) {
      ABI27_0_0RCTRawTextShadowView *rawTextShadowView = (ABI27_0_0RCTRawTextShadowView *)shadowView;
      NSString *text = rawTextShadowView.text;
      if (text) {
        NSAttributedString *rawTextAttributedString =
          [[NSAttributedString alloc] initWithString:rawTextShadowView.text
                                          attributes:textAttributes.effectiveTextAttributes];
        [attributedText appendAttributedString:rawTextAttributedString];
      }
      continue;
    }

    // Special Case: ABI27_0_0RCTBaseTextShadowView
    if ([shadowView isKindOfClass:[ABI27_0_0RCTBaseTextShadowView class]]) {
      ABI27_0_0RCTBaseTextShadowView *baseTextShadowView = (ABI27_0_0RCTBaseTextShadowView *)shadowView;
      NSAttributedString *baseTextAttributedString =
        [baseTextShadowView attributedTextWithBaseTextAttributes:textAttributes];
      [attributedText appendAttributedString:baseTextAttributedString];
      continue;
    }

    // Generic Case: Any ABI27_0_0RCTShadowView
    NSTextAttachment *attachment = [NSTextAttachment new];
    NSMutableAttributedString *embeddedShadowViewAttributedString = [NSMutableAttributedString new];
    [embeddedShadowViewAttributedString beginEditing];
    [embeddedShadowViewAttributedString appendAttributedString:[NSAttributedString attributedStringWithAttachment:attachment]];
    [embeddedShadowViewAttributedString addAttribute:ABI27_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
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

- (void)didUpdateReactABI27_0_0Subviews
{
  [super didUpdateReactABI27_0_0Subviews];
  [self dirtyLayout];
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];
  [self dirtyLayout];
}

@end
