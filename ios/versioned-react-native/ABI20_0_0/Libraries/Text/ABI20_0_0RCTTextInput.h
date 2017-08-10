/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI20_0_0/ABI20_0_0RCTView.h>

#import "ABI20_0_0RCTBackedTextInputViewProtocol.h"

@class ABI20_0_0RCTBridge;
@class ABI20_0_0RCTEventDispatcher;

@interface ABI20_0_0RCTTextInput : ABI20_0_0RCTView {
@protected
  ABI20_0_0RCTBridge *_bridge;
  ABI20_0_0RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithBridge:(ABI20_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@property (nonatomic, readonly) UIView<ABI20_0_0RCTBackedTextInputViewProtocol> *backedTextInputView;

@property (nonatomic, assign) UIEdgeInsets ReactABI20_0_0PaddingInsets;
@property (nonatomic, assign) UIEdgeInsets ReactABI20_0_0BorderInsets;
@property (nonatomic, assign, readonly) CGSize contentSize;

@property (nonatomic, copy) ABI20_0_0RCTDirectEventBlock onContentSizeChange;

- (void)invalidateContentSize;

@end
