/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTMultilineTextInputView.h>
#import <ABI49_0_0React/ABI49_0_0RCTMultilineTextInputViewManager.h>

@implementation ABI49_0_0RCTMultilineTextInputViewManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI49_0_0RCTMultilineTextInputView alloc] initWithBridge:self.bridge];
}

#pragma mark - Multiline <TextInput> (aka TextView) specific properties

ABI49_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.dataDetectorTypes, UIDataDetectorTypes)

@end
