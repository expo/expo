/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI25_0_0/ABI25_0_0RCTView.h>

#import "ABI25_0_0RCTBackedTextInputViewProtocol.h"
#import "ABI25_0_0RCTFontAttributes.h"
#import "ABI25_0_0RCTFontAttributesDelegate.h"

@class ABI25_0_0RCTBridge;
@class ABI25_0_0RCTEventDispatcher;
@class ABI25_0_0RCTTextSelection;

@interface ABI25_0_0RCTTextInput : ABI25_0_0RCTView <ABI25_0_0RCTFontAttributesDelegate> {
@protected
  __weak ABI25_0_0RCTBridge *_bridge;
  ABI25_0_0RCTEventDispatcher *_eventDispatcher;
  NSInteger _nativeEventCount;
  NSInteger _mostRecentEventCount;
  BOOL _blurOnSubmit;
}

- (instancetype)initWithBridge:(ABI25_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@property (nonatomic, readonly) UIView<ABI25_0_0RCTBackedTextInputViewProtocol> *backedTextInputView;

@property (nonatomic, assign) UIEdgeInsets ReactABI25_0_0PaddingInsets;
@property (nonatomic, assign) UIEdgeInsets ReactABI25_0_0BorderInsets;
@property (nonatomic, assign, readonly) CGSize contentSize;

@property (nonatomic, copy) ABI25_0_0RCTDirectEventBlock onContentSizeChange;
@property (nonatomic, copy) ABI25_0_0RCTDirectEventBlock onSelectionChange;

@property (nonatomic, readonly, strong) ABI25_0_0RCTFontAttributes *fontAttributes;

@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL clearTextOnFocus;
@property (nonatomic, copy) ABI25_0_0RCTTextSelection *selection;

- (void)setFont:(UIFont *)font;

- (void)invalidateContentSize;

// Temporary exposure of particial `ABI25_0_0RCTBackedTextInputDelegate` support.
// In the future all methods of the protocol should move to this class.
- (BOOL)textInputShouldBeginEditing;
- (void)textInputDidBeginEditing;
- (BOOL)textInputShouldReturn;
- (void)textInputDidReturn;
- (void)textInputDidChangeSelection;
- (BOOL)textInputShouldEndEditing;
- (void)textInputDidEndEditing;

@end
