/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI39_0_0React/ABI39_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of ABI39_0_0RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol) <ABI39_0_0RCTComponentViewProtocol>

+ (std::vector<ABI39_0_0facebook::ABI39_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(UIView<ABI39_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<ABI39_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(ABI39_0_0facebook::ABI39_0_0React::Props::Shared const &)props
           oldProps:(ABI39_0_0facebook::ABI39_0_0React::Props::Shared const &)oldProps;

- (void)updateEventEmitter:(ABI39_0_0facebook::ABI39_0_0React::EventEmitter::Shared const &)eventEmitter;

- (void)updateState:(ABI39_0_0facebook::ABI39_0_0React::State::Shared const &)state
           oldState:(ABI39_0_0facebook::ABI39_0_0React::State::Shared const &)oldState;

- (void)updateLayoutMetrics:(ABI39_0_0facebook::ABI39_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI39_0_0facebook::ABI39_0_0React::LayoutMetrics const &)oldLayoutMetrics;

- (void)finalizeUpdates:(ABI39_0_0RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (ABI39_0_0facebook::ABI39_0_0React::SharedProps)props;

@end

NS_ASSUME_NONNULL_END
