/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTSinglelineTextInputViewManager.h"

#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTFont.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView+Layout.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView.h>

#import "ABI26_0_0RCTConvert+Text.h"
#import "ABI26_0_0RCTSinglelineTextInputShadowView.h"
#import "ABI26_0_0RCTSinglelineTextInputView.h"
#import "ABI26_0_0RCTUITextField.h"

@implementation ABI26_0_0RCTSinglelineTextInputViewManager

ABI26_0_0RCT_EXPORT_MODULE()

- (ABI26_0_0RCTShadowView *)shadowView
{
  return [ABI26_0_0RCTSinglelineTextInputShadowView new];
}

- (UIView *)view
{
  return [[ABI26_0_0RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

#pragma mark - Singleline <TextInput> (aka TextField) specific properties

ABI26_0_0RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI26_0_0RCTDirectEventBlock)

@end
