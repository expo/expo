/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of ABI43_0_0RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol) <ABI43_0_0RCTComponentViewProtocol>

+ (std::vector<ABI43_0_0facebook::ABI43_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(UIView<ABI43_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<ABI43_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(ABI43_0_0facebook::ABI43_0_0React::Props::Shared const &)props
           oldProps:(ABI43_0_0facebook::ABI43_0_0React::Props::Shared const &)oldProps;

- (void)updateEventEmitter:(ABI43_0_0facebook::ABI43_0_0React::EventEmitter::Shared const &)eventEmitter;

- (void)updateState:(ABI43_0_0facebook::ABI43_0_0React::State::Shared const &)state
           oldState:(ABI43_0_0facebook::ABI43_0_0React::State::Shared const &)oldState;

- (void)updateLayoutMetrics:(ABI43_0_0facebook::ABI43_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI43_0_0facebook::ABI43_0_0React::LayoutMetrics const &)oldLayoutMetrics;

- (void)finalizeUpdates:(RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (ABI43_0_0facebook::ABI43_0_0React::SharedProps)props;

- (void)setPropKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN:(nullable NSSet<NSString *> *)props;
- (nullable NSSet<NSString *> *)propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN;

@end

NS_ASSUME_NONNULL_END
