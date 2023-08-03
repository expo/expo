/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTSinglelineTextInputView.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>

#import <ABI49_0_0React/ABI49_0_0RCTUITextField.h>

@implementation ABI49_0_0RCTSinglelineTextInputView {
  ABI49_0_0RCTUITextField *_backedTextInputView;
}

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    // `submitBehavior` defaults to `"blurAndSubmit"` for <TextInput multiline={false}> by design.
    self.submitBehavior = @"blurAndSubmit";

    _backedTextInputView = [[ABI49_0_0RCTUITextField alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInputView.textInputDelegate = self;

    [self addSubview:_backedTextInputView];
  }

  return self;
}

- (id<ABI49_0_0RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

@end
