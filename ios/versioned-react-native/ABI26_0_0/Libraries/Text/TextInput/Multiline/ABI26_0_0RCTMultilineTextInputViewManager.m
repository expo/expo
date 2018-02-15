/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTMultilineTextInputViewManager.h"

#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTFont.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView+Layout.h>
#import <ReactABI26_0_0/ABI26_0_0RCTShadowView.h>

#import "ABI26_0_0RCTConvert+Text.h"
#import "ABI26_0_0RCTMultilineTextInputShadowView.h"
#import "ABI26_0_0RCTMultilineTextInputView.h"

@implementation ABI26_0_0RCTMultilineTextInputViewManager

ABI26_0_0RCT_EXPORT_MODULE()

- (ABI26_0_0RCTShadowView *)shadowView
{
  return [ABI26_0_0RCTMultilineTextInputShadowView new];
}

- (UIView *)view
{
  return [[ABI26_0_0RCTMultilineTextInputView alloc] initWithBridge:self.bridge];
}

#pragma mark - Multiline <TextInput> (aka TextView) specific properties

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onTextInput, ABI26_0_0RCTDirectEventBlock)

#if !TARGET_OS_TV
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.dataDetectorTypes, UIDataDetectorTypes)
#endif

@end
