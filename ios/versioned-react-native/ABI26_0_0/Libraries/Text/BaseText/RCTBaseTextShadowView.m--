/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTBaseTextShadowView.h"

#import <ReactABI26_0_0/ABI26_0_0RCTShadowView+Layout.h>

#import "ABI26_0_0RCTRawTextShadowView.h"
#import "ABI26_0_0RCTVirtualTextShadowView.h"

NSString *const ABI26_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName = @"ABI26_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName";

@implementation ABI26_0_0RCTBaseTextShadowView
{
  NSAttributedString *_Nullable _cachedAttributedText;
  ABI26_0_0RCTTextAttributes *_Nullable _cachedTextAttributes;
}

- (instancetype)init
{
  if (self = [super init]) {
    _textAttributes = [ABI26_0_0RCTTextAttributes new];
  }

  return self;
}

- (void)setReactABI26_0_0Tag:(NSNumber *)ReactABI26_0_0Tag
{
  [super setReactABI26_0_0Tag:ReactABI26_0_0Tag];
  _textAttributes.tag = ReactABI26_0_0Tag;
}

#pragma mark - attributedString

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable ABI26_0_0RCTTextAttributes *)baseTextAttributes
{
  ABI26_0_0RCTTextAttributes *textAttributes;

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

  for (ABI26_0_0RCTShadowView *shadowView in self.ReactABI26_0_0Subviews) {
    // Special Case: ABI26_0_0RCTRawTextShadowView
    if ([shadowView isKindOfClass:[ABI26_0_0RCTRawTextShadowView class]]) {
      ABI26_0_0RCTRawTextShadowView *rawTextShadowView = (ABI26_0_0RCTRawTextShadowView *)shadowView;
      NSString *text = rawTextShadowView.text;
      if (text) {
        NSAttributedString *rawTextAttributedString =
          [[NSAttributedString alloc] initWithString:rawTextShadowView.text
                                          attributes:textAttributes.effectiveTextAttributes];
        [attributedText appendAttributedString:rawTextAttributedString];
      }
      continue;
    }

    // Special Case: ABI26_0_0RCTBaseTextShadowView
    if ([shadowView isKindOfClass:[ABI26_0_0RCTBaseTextShadowView class]]) {
      ABI26_0_0RCTBaseTextShadowView *baseTextShadowView = (ABI26_0_0RCTBaseTextShadowView *)shadowView;
      NSAttributedString *baseTextAttributedString =
        [baseTextShadowView attributedTextWithBaseTextAttributes:textAttributes];
      [attributedText appendAttributedString:baseTextAttributedString];
      continue;
    }

    // Generic Case: Any ABI26_0_0RCTShadowView
    NSTextAttachment *attachment = [NSTextAttachment new];
    NSMutableAttributedString *embeddedShadowViewAttributedString = [NSMutableAttributedString new];
    [embeddedShadowViewAttributedString beginEditing];
    [embeddedShadowViewAttributedString appendAttributedString:[NSAttributedString attributedStringWithAttachment:attachment]];
    [embeddedShadowViewAttributedString addAttribute:ABI26_0_0RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
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

- (void)didUpdateReactABI26_0_0Subviews
{
  [super didUpdateReactABI26_0_0Subviews];
  [self dirtyLayout];
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];
  [self dirtyLayout];
}

@end
