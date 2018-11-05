// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

typedef CGSize (^ABI26_0_0RCTWrapperMeasureBlock)(CGSize minimumSize, CGSize maximumSize);

@class ABI26_0_0RCTBridge;

NS_ASSUME_NONNULL_BEGIN

@interface ABI26_0_0RCTWrapperView : UIView

@property (nonatomic, retain, nullable) UIView *contentView;
@property (nonatomic, readonly) ABI26_0_0RCTWrapperMeasureBlock measureBlock;

- (instancetype)initWithBridge:(ABI26_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

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
