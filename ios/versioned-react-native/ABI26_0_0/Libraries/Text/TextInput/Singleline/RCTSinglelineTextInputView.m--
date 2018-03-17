/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTSinglelineTextInputView.h"

#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>

#import "ABI26_0_0RCTUITextField.h"

@implementation ABI26_0_0RCTSinglelineTextInputView
{
  ABI26_0_0RCTUITextField *_backedTextInputView;
}

- (instancetype)initWithBridge:(ABI26_0_0RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    // `blurOnSubmit` defaults to `true` for <TextInput multiline={false}> by design.
    self.blurOnSubmit = YES;

    _backedTextInputView = [[ABI26_0_0RCTUITextField alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInputView.textInputDelegate = self;

    [self addSubview:_backedTextInputView];
  }

  return self;
}

ABI26_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
ABI26_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)coder)

- (id<ABI26_0_0RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

@end
