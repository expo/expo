/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI23_0_0RCTBackedTextInputViewProtocol.h"

#import "ABI23_0_0RCTBackedTextInputDelegate.h"

NS_ASSUME_NONNULL_BEGIN

/*
 * Just regular UITextView... but much better!
 */
@interface ABI23_0_0RCTUITextView : UITextView <ABI23_0_0RCTBackedTextInputViewProtocol>

- (instancetype)initWithFrame:(CGRect)frame textContainer:(nullable NSTextContainer *)textContainer NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)aDecoder NS_UNAVAILABLE;

@property (nonatomic, weak) id<ABI23_0_0RCTBackedTextInputDelegate> textInputDelegate;

@property (nonatomic, assign, readonly) BOOL textWasPasted;
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, strong, nullable) UIColor *placeholderColor;

@property (nonatomic, assign) CGFloat preferredMaxLayoutWidth;

@end

NS_ASSUME_NONNULL_END
