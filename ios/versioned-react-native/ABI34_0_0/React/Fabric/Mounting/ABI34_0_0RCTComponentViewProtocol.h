/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTPrimitives.h>
#import <ReactABI34_0_0/core/LayoutMetrics.h>
#import <ReactABI34_0_0/core/LocalData.h>
#import <ReactABI34_0_0/core/Props.h>
#import <ReactABI34_0_0/events/EventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Represents a `UIView` instance managed by ReactABI34_0_0.
 * All methods are non-@optional.
 * `UIView+ComponentViewProtocol` category provides default implementation
 * for all of them.
 */
@protocol ABI34_0_0RCTComponentViewProtocol <NSObject>

/*
 * Returns ComponentHandle of ComponentDescriptor which this ComponentView
 * represents.
 */
+ (facebook::ReactABI34_0_0::ComponentHandle)componentHandle;

/*
 * Called for mounting (attaching) a child component view inside `self`
 * component view.
 * Receiver must add `childComponentView` as a subview.
 */
- (void)mountChildComponentView:(UIView<ABI34_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

/*
 * Called for unmounting (detaching) a child component view from `self`
 * component view.
 * Receiver must remove `childComponentView` as a subview.
 */
- (void)unmountChildComponentView:(UIView<ABI34_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

/*
 * Called for updating component's props.
 * Receiver must update native view props accordingly changed props.
 */
- (void)updateProps:(facebook::ReactABI34_0_0::SharedProps)props oldProps:(facebook::ReactABI34_0_0::SharedProps)oldProps;

/*
 * Called for updating component's local data.
 * Receiver must update native view props accordingly changed local data.
 */
- (void)updateLocalData:(facebook::ReactABI34_0_0::SharedLocalData)localData
           oldLocalData:(facebook::ReactABI34_0_0::SharedLocalData)oldLocalData;

/*
 * Called for updating component's event handlers set.
 * Receiver must cache `eventEmitter` object inside and use it for emitting
 * events when needed.
 */
- (void)updateEventEmitter:(facebook::ReactABI34_0_0::SharedEventEmitter)eventEmitter;

/*
 * Called for updating component's layout metrics.
 * Receiver must update `UIView` layout-related fields (such as `frame`,
 * `bounds`, `layer.zPosition`, and so on) accordingly.
 */
- (void)updateLayoutMetrics:(facebook::ReactABI34_0_0::LayoutMetrics)layoutMetrics
           oldLayoutMetrics:(facebook::ReactABI34_0_0::LayoutMetrics)oldLayoutMetrics;

/*
 * Called right after the component view is moved to a recycle pool.
 * Receiver must reset any local state and release associated
 * non-reusable resources.
 */
- (void)prepareForRecycle;

@end

NS_ASSUME_NONNULL_END
