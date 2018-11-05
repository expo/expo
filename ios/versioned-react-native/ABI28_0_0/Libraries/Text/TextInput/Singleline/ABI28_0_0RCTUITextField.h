/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "ABI28_0_0RCTBackedTextInputViewProtocol.h"

NS_ASSUME_NONNULL_BEGIN

/*
 * Just regular UITextField... but much better!
 */
@interface ABI28_0_0RCTUITextField : UITextField <ABI28_0_0RCTBackedTextInputViewProtocol>

- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

@property (nonatomic, weak) id<ABI28_0_0RCTBackedTextInputDelegate> textInputDelegate;

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL contextMenuHidden;
@property (nonatomic, assign, readonly) BOOL textWasPasted;
@property (nonatomic, strong, nullable) UIColor *placeholderColor;
@property (nonatomic, assign) UIEdgeInsets textContainerInset;
@property (nonatomic, assign, getter=isEditable) BOOL editable;

@end

NS_ASSUME_NONNULL_END
