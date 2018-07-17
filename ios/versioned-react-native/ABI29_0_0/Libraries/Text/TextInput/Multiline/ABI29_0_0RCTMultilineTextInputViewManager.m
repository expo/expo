/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTMultilineTextInputViewManager.h"

#import "ABI29_0_0RCTMultilineTextInputView.h"

@implementation ABI29_0_0RCTMultilineTextInputViewManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI29_0_0RCTMultilineTextInputView alloc] initWithBridge:self.bridge];
}

#pragma mark - Multiline <TextInput> (aka TextView) specific properties

#if !TARGET_OS_TV
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.dataDetectorTypes, UIDataDetectorTypes)
#endif

@end
