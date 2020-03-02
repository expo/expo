/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of ABI37_0_0RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol) <ABI37_0_0RCTComponentViewProtocol>

+ (std::vector<ABI37_0_0facebook::ABI37_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

- (void)mountChildComponentView:(UIView<ABI37_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<ABI37_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(ABI37_0_0facebook::ABI37_0_0React::Props::Shared const &)props
           oldProps:(ABI37_0_0facebook::ABI37_0_0React::Props::Shared const &)oldProps;

- (void)updateEventEmitter:(ABI37_0_0facebook::ABI37_0_0React::EventEmitter::Shared const &)eventEmitter;

- (void)updateLocalData:(ABI37_0_0facebook::ABI37_0_0React::SharedLocalData)localData
           oldLocalData:(ABI37_0_0facebook::ABI37_0_0React::SharedLocalData)oldLocalData;

- (void)updateState:(ABI37_0_0facebook::ABI37_0_0React::State::Shared const &)state
           oldState:(ABI37_0_0facebook::ABI37_0_0React::State::Shared const &)oldState;

- (void)updateLayoutMetrics:(ABI37_0_0facebook::ABI37_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI37_0_0facebook::ABI37_0_0React::LayoutMetrics const &)oldLayoutMetrics;

- (void)finalizeUpdates:(ABI37_0_0RNComponentViewUpdateMask)updateMask;

- (void)prepareForRecycle;

- (ABI37_0_0facebook::ABI37_0_0React::SharedProps)props;

@end

NS_ASSUME_NONNULL_END
