/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of ABI41_0_0RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol) <ABI41_0_0RCTComponentViewProtocol>

+ (std::vector<ABI41_0_0facebook::ABI41_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(UIView<ABI41_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<ABI41_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(ABI41_0_0facebook::ABI41_0_0React::Props::Shared const &)props
           oldProps:(ABI41_0_0facebook::ABI41_0_0React::Props::Shared const &)oldProps;

- (void)updateEventEmitter:(ABI41_0_0facebook::ABI41_0_0React::EventEmitter::Shared const &)eventEmitter;

- (void)updateState:(ABI41_0_0facebook::ABI41_0_0React::State::Shared const &)state
           oldState:(ABI41_0_0facebook::ABI41_0_0React::State::Shared const &)oldState;

- (void)updateLayoutMetrics:(ABI41_0_0facebook::ABI41_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI41_0_0facebook::ABI41_0_0React::LayoutMetrics const &)oldLayoutMetrics;

- (void)finalizeUpdates:(ABI41_0_0RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (ABI41_0_0facebook::ABI41_0_0React::SharedProps)props;

@end

NS_ASSUME_NONNULL_END
