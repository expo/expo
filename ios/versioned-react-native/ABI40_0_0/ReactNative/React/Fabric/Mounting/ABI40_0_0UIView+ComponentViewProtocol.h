/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI40_0_0React/ABI40_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of ABI40_0_0RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol) <ABI40_0_0RCTComponentViewProtocol>

+ (std::vector<ABI40_0_0facebook::ABI40_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(UIView<ABI40_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<ABI40_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(ABI40_0_0facebook::ABI40_0_0React::Props::Shared const &)props
           oldProps:(ABI40_0_0facebook::ABI40_0_0React::Props::Shared const &)oldProps;

- (void)updateEventEmitter:(ABI40_0_0facebook::ABI40_0_0React::EventEmitter::Shared const &)eventEmitter;

- (void)updateState:(ABI40_0_0facebook::ABI40_0_0React::State::Shared const &)state
           oldState:(ABI40_0_0facebook::ABI40_0_0React::State::Shared const &)oldState;

- (void)updateLayoutMetrics:(ABI40_0_0facebook::ABI40_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI40_0_0facebook::ABI40_0_0React::LayoutMetrics const &)oldLayoutMetrics;

- (void)finalizeUpdates:(ABI40_0_0RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (ABI40_0_0facebook::ABI40_0_0React::SharedProps)props;

@end

NS_ASSUME_NONNULL_END
