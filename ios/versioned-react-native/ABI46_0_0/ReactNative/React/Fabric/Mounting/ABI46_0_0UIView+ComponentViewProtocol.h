/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI46_0_0React/ABI46_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of ABI46_0_0RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol) <ABI46_0_0RCTComponentViewProtocol>

+ (std::vector<ABI46_0_0facebook::ABI46_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(UIView<ABI46_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<ABI46_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(ABI46_0_0facebook::ABI46_0_0React::Props::Shared const &)props
           oldProps:(ABI46_0_0facebook::ABI46_0_0React::Props::Shared const &)oldProps;

- (void)updateEventEmitter:(ABI46_0_0facebook::ABI46_0_0React::EventEmitter::Shared const &)eventEmitter;

- (void)updateState:(ABI46_0_0facebook::ABI46_0_0React::State::Shared const &)state
           oldState:(ABI46_0_0facebook::ABI46_0_0React::State::Shared const &)oldState;

- (void)updateLayoutMetrics:(ABI46_0_0facebook::ABI46_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI46_0_0facebook::ABI46_0_0React::LayoutMetrics const &)oldLayoutMetrics;

- (void)finalizeUpdates:(ABI46_0_0RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (ABI46_0_0facebook::ABI46_0_0React::SharedProps)props;

- (void)setIsJSResponder:(BOOL)isJSResponder;

- (void)setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:(nullable NSSet<NSString *> *)props;
- (nullable NSSet<NSString *> *)propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN;

- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView;

@end

NS_ASSUME_NONNULL_END
