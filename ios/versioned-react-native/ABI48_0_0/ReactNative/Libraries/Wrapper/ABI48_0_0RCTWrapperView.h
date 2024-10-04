/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

typedef CGSize (^ABI48_0_0RCTWrapperMeasureBlock)(CGSize minimumSize, CGSize maximumSize);

@class ABI48_0_0RCTBridge;

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0RCTWrapperView : UIView

@property (nonatomic, retain, nullable) UIView *contentView;
@property (nonatomic, readonly) ABI48_0_0RCTWrapperMeasureBlock measureBlock;

- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

#pragma mark - Restrictions

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

- (void)addSubview:(UIView *)view NS_UNAVAILABLE;
- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index NS_UNAVAILABLE;
- (void)insertSubview:(UIView *)view aboveSubview:(UIView *)siblingSubview NS_UNAVAILABLE;
- (void)insertSubview:(UIView *)view belowSubview:(UIView *)siblingSubview NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
