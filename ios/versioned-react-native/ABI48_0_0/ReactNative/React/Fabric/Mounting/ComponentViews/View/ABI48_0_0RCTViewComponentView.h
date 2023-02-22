/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTComponentViewProtocol.h>
#import <ABI48_0_0React/ABI48_0_0RCTConstants.h>
#import <ABI48_0_0React/ABI48_0_0RCTTouchableComponentViewProtocol.h>
#import <ABI48_0_0React/ABI48_0_0UIView+ComponentViewProtocol.h>
#import <ABI48_0_0React/ABI48_0_0renderer/components/view/ViewEventEmitter.h>
#import <ABI48_0_0React/ABI48_0_0renderer/components/view/ViewProps.h>
#import <ABI48_0_0React/ABI48_0_0renderer/core/EventEmitter.h>
#import <ABI48_0_0React/ABI48_0_0renderer/core/LayoutMetrics.h>
#import <ABI48_0_0React/ABI48_0_0renderer/core/Props.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView class for <View> component.
 */
@interface ABI48_0_0RCTViewComponentView : UIView <ABI48_0_0RCTComponentViewProtocol, ABI48_0_0RCTTouchableComponentViewProtocol> {
 @protected
  ABI48_0_0facebook::ABI48_0_0React::LayoutMetrics _layoutMetrics;
  ABI48_0_0facebook::ABI48_0_0React::SharedViewProps _props;
  ABI48_0_0facebook::ABI48_0_0React::SharedViewEventEmitter _eventEmitter;
}

/**
 * Represents the `UIView` instance that is being automatically attached to
 * the component view and laid out using on `layoutMetrics` (especially `size`
 * and `padding`) of the component.
 * This view must not be a component view; it's just a convenient way
 * to embed/bridge pure native views as component views.
 * Defaults to `nil`. Assign `nil` to remove view as subview.
 */
@property (nonatomic, strong, nullable) UIView *contentView;

/**
 * Provides access to `nativeId` prop of the component.
 * It might be used by subclasses (which need to refer to the view from
 * other platform-specific external views or systems by some id) or
 * by debugging/inspection tools.
 * Defaults to `nil`.
 */
@property (nonatomic, strong, nullable) NSString *nativeId;

/**
 * Provides access to `foregroundColor` prop of the component.
 * Must be used by subclasses only.
 */
@property (nonatomic, strong, nullable) UIColor *foregroundColor;

/**
 * Returns the object - usually (sub)view - which represents this
 * component view in terms of accessibility.
 * All accessibility properties will be applied to this object.
 * May be overridden in subclass which needs to be accessiblitywise
 * transparent in favour of some subview.
 * Defaults to `self`.
 */
@property (nonatomic, strong, nullable, readonly) NSObject *accessibilityElement;

/**
 * Insets used when hit testing inside this view.
 */
@property (nonatomic, assign) UIEdgeInsets hitTestEdgeInsets;

/**
 * Flag indicating if subview clipping is enabled for the view.
 * If subview clipping is enabled, subviews that are outside of the viewport may be removed from the view hierachy.
 */
@property (nonatomic, readonly) BOOL removeClippedSubviews;

/**
 * Enforcing `call super` semantic for overridden methods from `ABI48_0_0RCTComponentViewProtocol`.
 * The methods update the instance variables.
 */
- (void)updateProps:(ABI48_0_0facebook::ABI48_0_0React::Props::Shared const &)props
           oldProps:(ABI48_0_0facebook::ABI48_0_0React::Props::Shared const &)oldProps NS_REQUIRES_SUPER;
- (void)updateEventEmitter:(ABI48_0_0facebook::ABI48_0_0React::EventEmitter::Shared const &)eventEmitter NS_REQUIRES_SUPER;
- (void)updateLayoutMetrics:(ABI48_0_0facebook::ABI48_0_0React::LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(ABI48_0_0facebook::ABI48_0_0React::LayoutMetrics const &)oldLayoutMetrics NS_REQUIRES_SUPER;
- (void)finalizeUpdates:(ABI48_0_0RNComponentViewUpdateMask)updateMask NS_REQUIRES_SUPER;
- (void)prepareForRecycle NS_REQUIRES_SUPER;

/*
 * This is a fragment of temporary workaround that we need only temporary and will get rid of soon.
 */
- (NSString *)componentViewName_DO_NOT_USE_THIS_IS_BROKEN;

@end

NS_ASSUME_NONNULL_END
