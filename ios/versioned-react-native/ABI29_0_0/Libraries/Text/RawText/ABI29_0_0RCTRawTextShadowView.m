/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTRawTextShadowView.h"

#import <ReactABI29_0_0/ABI29_0_0RCTShadowView+Layout.h>

@implementation ABI29_0_0RCTRawTextShadowView

- (void)setText:(NSString *)text
{
  if (_text != text && ![_text isEqualToString:text]) {
    _text = [text copy];
    [self dirtyLayout];
  }
}

- (void)dirtyLayout
{
  [self.superview dirtyLayout];
}

- (NSString *)description
{
  NSString *superDescription = super.description;
  return [[superDescription substringToIndex:superDescription.length - 1] stringByAppendingFormat:@"; text: %@>", self.text];
}

@end
