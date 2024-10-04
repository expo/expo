/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTBackedTextInputViewProtocol.h>
#import <ABI42_0_0React/ABI42_0_0RCTBackedTextInputDelegate.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Just regular UITextField... but much better!
 */
@interface ABI42_0_0RCTUITextField : UITextField <ABI42_0_0RCTBackedTextInputViewProtocol>

- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

@property (nonatomic, weak) id<ABI42_0_0RCTBackedTextInputDelegate> textInputDelegate;

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL contextMenuHidden;
@property (nonatomic, assign, readonly) BOOL textWasPasted;
@property (nonatomic, strong, nullable) UIColor *placeholderColor;
@property (nonatomic, assign) UIEdgeInsets textContainerInset;
@property (nonatomic, assign, getter=isEditable) BOOL editable;
@property (nonatomic, getter=isScrollEnabled) BOOL scrollEnabled;

@end

NS_ASSUME_NONNULL_END
