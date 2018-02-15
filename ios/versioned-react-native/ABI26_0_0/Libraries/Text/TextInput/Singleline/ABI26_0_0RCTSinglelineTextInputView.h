/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI26_0_0/ABI26_0_0RCTComponent.h>
#import <ReactABI26_0_0/ABI26_0_0RCTView.h>

#import "ABI26_0_0RCTBaseTextInputView.h"

@class ABI26_0_0RCTUITextField;

@interface ABI26_0_0RCTSinglelineTextInputView : ABI26_0_0RCTBaseTextInputView

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, strong) NSNumber *maxLength;

@end
