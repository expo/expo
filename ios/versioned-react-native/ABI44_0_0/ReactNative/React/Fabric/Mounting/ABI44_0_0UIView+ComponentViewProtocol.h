/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of ABI44_0_0RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol) <ABI44_0_0RCTComponentViewProtocol>

+ (std::vector<ABI44_0_0facebook::ABI44_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(UIView<ABI44_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<ABI44_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(ABI44_0_0facebook::ABI44_0_0React::Props::Shared const &)props
           oldProps:(ABI44_0_0facebook::ABI44_0_0React::Props::Shared const &)oldProps;

- (void)updateEventEmitter:(ABI44_0_0facebook::ABI44_0_0React::EventEmitter::Shared const &)eventEmitter;

- (void)updateState:(ABI44_0_0facebook::ABI44_0_0React::State::Shared const &)state
           oldState:(ABI44_0_0facebook::ABI44_0_0React::State::Shared const &)oldState;

- (void)updateLayoutMetrics:(ABI44_0_0facebook::ABI44_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI44_0_0facebook::ABI44_0_0React::LayoutMetrics const &)oldLayoutMetrics;

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (ABI44_0_0facebook::ABI44_0_0React::SharedProps)props;

- (void)setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:(nullable NSSet<NSString *> *)props;
- (nullable NSSet<NSString *> *)propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN;

@end

NS_ASSUME_NONNULL_END
