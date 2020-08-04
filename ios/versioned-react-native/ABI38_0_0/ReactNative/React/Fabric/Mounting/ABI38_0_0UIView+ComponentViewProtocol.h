/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of ABI38_0_0RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol) <ABI38_0_0RCTComponentViewProtocol>

+ (std::vector<ABI38_0_0facebook::ABI38_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(UIView<ABI38_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<ABI38_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(ABI38_0_0facebook::ABI38_0_0React::Props::Shared const &)props
           oldProps:(ABI38_0_0facebook::ABI38_0_0React::Props::Shared const &)oldProps;

- (void)updateEventEmitter:(ABI38_0_0facebook::ABI38_0_0React::EventEmitter::Shared const &)eventEmitter;

- (void)updateLocalData:(ABI38_0_0facebook::ABI38_0_0React::SharedLocalData)localData
           oldLocalData:(ABI38_0_0facebook::ABI38_0_0React::SharedLocalData)oldLocalData;

- (void)updateState:(ABI38_0_0facebook::ABI38_0_0React::State::Shared const &)state
           oldState:(ABI38_0_0facebook::ABI38_0_0React::State::Shared const &)oldState;

- (void)updateLayoutMetrics:(ABI38_0_0facebook::ABI38_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI38_0_0facebook::ABI38_0_0React::LayoutMetrics const &)oldLayoutMetrics;

- (void)finalizeUpdates:(ABI38_0_0RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (ABI38_0_0facebook::ABI38_0_0React::SharedProps)props;

@end

NS_ASSUME_NONNULL_END
