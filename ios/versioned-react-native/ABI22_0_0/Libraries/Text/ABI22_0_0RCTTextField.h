/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI22_0_0/ABI22_0_0RCTComponent.h>
#import <ReactABI22_0_0/ABI22_0_0RCTView.h>

#import "ABI22_0_0RCTTextInput.h"

@class ABI22_0_0RCTUITextField;

@interface ABI22_0_0RCTTextField : ABI22_0_0RCTTextInput

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, strong) NSNumber *maxLength;

@end
