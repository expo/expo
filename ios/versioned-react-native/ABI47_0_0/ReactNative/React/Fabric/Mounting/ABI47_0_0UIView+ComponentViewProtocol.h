/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of ABI47_0_0RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol) <ABI47_0_0RCTComponentViewProtocol>

+ (std::vector<ABI47_0_0facebook::ABI47_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(UIView<ABI47_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<ABI47_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(ABI47_0_0facebook::ABI47_0_0React::Props::Shared const &)props
           oldProps:(ABI47_0_0facebook::ABI47_0_0React::Props::Shared const &)oldProps;

- (void)updateEventEmitter:(ABI47_0_0facebook::ABI47_0_0React::EventEmitter::Shared const &)eventEmitter;

- (void)updateState:(ABI47_0_0facebook::ABI47_0_0React::State::Shared const &)state
           oldState:(ABI47_0_0facebook::ABI47_0_0React::State::Shared const &)oldState;

- (void)updateLayoutMetrics:(ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI47_0_0facebook::ABI47_0_0React::LayoutMetrics const &)oldLayoutMetrics;

- (void)finalizeUpdates:(ABI47_0_0RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (ABI47_0_0facebook::ABI47_0_0React::Props::Shared)props;

- (void)setIsJSResponder:(BOOL)isJSResponder;

- (void)setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:(nullable NSSet<NSString *> *)props;
- (nullable NSSet<NSString *> *)propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN;

- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView;

@end

NS_ASSUME_NONNULL_END
