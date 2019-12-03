/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTComponentViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Default implementation of ABI34_0_0RCTComponentViewProtocol.
 */
@interface UIView (ComponentViewProtocol)

- (void)mountChildComponentView:(UIView<ABI34_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)unmountChildComponentView:(UIView<ABI34_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

- (void)updateProps:(facebook::ReactABI34_0_0::SharedProps)props oldProps:(facebook::ReactABI34_0_0::SharedProps)oldProps;

- (void)updateEventEmitter:(facebook::ReactABI34_0_0::SharedEventEmitter)eventEmitter;

- (void)updateLocalData:(facebook::ReactABI34_0_0::SharedLocalData)localData
           oldLocalData:(facebook::ReactABI34_0_0::SharedLocalData)oldLocalData;

- (void)updateLayoutMetrics:(facebook::ReactABI34_0_0::LayoutMetrics)layoutMetrics
           oldLayoutMetrics:(facebook::ReactABI34_0_0::LayoutMetrics)oldLayoutMetrics;

- (void)prepareForRecycle;

@end

NS_ASSUME_NONNULL_END
