/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTPrimitives.h>
#import <ABI42_0_0React/core/EventEmitter.h>
#import <ABI42_0_0React/core/LayoutMetrics.h>
#import <ABI42_0_0React/core/Props.h>
#import <ABI42_0_0React/core/State.h>
#import <ABI42_0_0React/uimanager/ComponentDescriptorProvider.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * Bitmask for all types of possible updates performing during mounting.
 */
typedef NS_OPTIONS(NSInteger, ABI42_0_0RNComponentViewUpdateMask) {
  ABI42_0_0RNComponentViewUpdateMaskNone = 0,
  ABI42_0_0RNComponentViewUpdateMaskProps = 1 << 0,
  ABI42_0_0RNComponentViewUpdateMaskEventEmitter = 1 << 1,
  ABI42_0_0RNComponentViewUpdateMaskState = 1 << 3,
  ABI42_0_0RNComponentViewUpdateMaskLayoutMetrics = 1 << 4,

  ABI42_0_0RNComponentViewUpdateMaskAll = ABI42_0_0RNComponentViewUpdateMaskProps | ABI42_0_0RNComponentViewUpdateMaskEventEmitter |
      ABI42_0_0RNComponentViewUpdateMaskState | ABI42_0_0RNComponentViewUpdateMaskLayoutMetrics
};

/*
 * Represents a `UIView` instance managed by ABI42_0_0React.
 * All methods are non-@optional.
 * `UIView+ComponentViewProtocol` category provides default implementation
 * for all of them.
 */
@protocol ABI42_0_0RCTComponentViewProtocol <NSObject>

/*
 * Returns a `ComponentDescriptorProvider` of a particular `ComponentDescriptor` which this component view
 * represents.
 */
+ (ABI42_0_0facebook::ABI42_0_0React::ComponentDescriptorProvider)componentDescriptorProvider;

/*
 * Returns a list of supplemental  `ComponentDescriptorProvider`s (with do not have `ComponentView` counterparts) that
 * require for this component view.
 */
+ (std::vector<ABI42_0_0facebook::ABI42_0_0React::ComponentDescriptorProvider>)supplementalComponentDescriptorProviders;

/*
 * Called for mounting (attaching) a child component view inside `self`
 * component view.
 * Receiver must add `childComponentView` as a subview.
 */
- (void)mountChildComponentView:(UIView<ABI42_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

/*
 * Called for unmounting (detaching) a child component view from `self`
 * component view.
 * Receiver must remove `childComponentView` as a subview.
 */
- (void)unmountChildComponentView:(UIView<ABI42_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index;

/*
 * Called for updating component's props.
 * Receiver must update native view props accordingly changed props.
 */
- (void)updateProps:(ABI42_0_0facebook::ABI42_0_0React::Props::Shared const &)props
           oldProps:(ABI42_0_0facebook::ABI42_0_0React::Props::Shared const &)oldProps;

/*
 * Called for updating component's state.
 * Receiver must update native view according to changed state.
 */
- (void)updateState:(ABI42_0_0facebook::ABI42_0_0React::State::Shared const &)state
           oldState:(ABI42_0_0facebook::ABI42_0_0React::State::Shared const &)oldState;

/*
 * Called for updating component's event handlers set.
 * Receiver must cache `eventEmitter` object inside and use it for emitting
 * events when needed.
 */
- (void)updateEventEmitter:(ABI42_0_0facebook::ABI42_0_0React::EventEmitter::Shared const &)eventEmitter;

/*
 * Called for updating component's layout metrics.
 * Receiver must update `UIView` layout-related fields (such as `frame`,
 * `bounds`, `layer.zPosition`, and so on) accordingly.
 */
- (void)updateLayoutMetrics:(ABI42_0_0facebook::ABI42_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI42_0_0facebook::ABI42_0_0React::LayoutMetrics const &)oldLayoutMetrics;

/*
 * Called when receiving a command
 */
- (void)handleCommand:(NSString const *)commandName args:(NSArray const *)args;

/*
 * Called right after all update methods were called for a particular component view.
 * Useful for performing updates that require knowledge of several independent aspects of the compound mounting change
 * (e.g. props *and* layout constraints).
 */
- (void)finalizeUpdates:(ABI42_0_0RNComponentViewUpdateMask)updateMask;

/*
 * Called right after the component view is moved to a recycle pool.
 * Receiver must reset any local state and release associated
 * non-reusable resources.
 */
- (void)prepareForRecycle;

/**
 * Read the last props used to update the view.
 */
- (ABI42_0_0facebook::ABI42_0_0React::SharedProps)props;

@end

NS_ASSUME_NONNULL_END
