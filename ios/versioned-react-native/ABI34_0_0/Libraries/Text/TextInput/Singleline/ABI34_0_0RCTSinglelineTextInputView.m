/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTSinglelineTextInputView.h"

#import <ReactABI34_0_0/ABI34_0_0RCTBridge.h>

#import "ABI34_0_0RCTUITextField.h"

@implementation ABI34_0_0RCTSinglelineTextInputView
{
  ABI34_0_0RCTUITextField *_backedTextInputView;
}

- (instancetype)initWithBridge:(ABI34_0_0RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    // `blurOnSubmit` defaults to `true` for <TextInput multiline={false}> by design.
    self.blurOnSubmit = YES;

    _backedTextInputView = [[ABI34_0_0RCTUITextField alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInputView.textInputDelegate = self;

    [self addSubview:_backedTextInputView];
  }

  return self;
}

- (id<ABI34_0_0RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

@end
