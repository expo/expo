/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI19_0_0/ABI19_0_0RCTComponent.h>
#import <ReactABI19_0_0/ABI19_0_0RCTView.h>

@class ABI19_0_0RCTBridge;
@class ABI19_0_0RCTUITextField;

@interface ABI19_0_0RCTTextField : ABI19_0_0RCTView

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, strong) NSNumber *maxLength;
@property (nonatomic, assign) UIEdgeInsets ReactABI19_0_0PaddingInsets;
@property (nonatomic, assign) UIEdgeInsets ReactABI19_0_0BorderInsets;

@property (nonatomic, copy) ABI19_0_0RCTDirectEventBlock onSelectionChange;

@property (nonatomic, strong) ABI19_0_0RCTUITextField *textField;

- (instancetype)initWithBridge:(ABI19_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@end
