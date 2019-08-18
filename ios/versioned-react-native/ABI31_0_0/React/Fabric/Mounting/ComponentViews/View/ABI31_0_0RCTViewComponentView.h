/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI31_0_0/ABI31_0_0RCTComponentViewProtocol.h>
#import <ReactABI31_0_0/UIView+ComponentViewProtocol.h>
#import <ABI31_0_0fabric/ABI31_0_0core/LayoutMetrics.h>
#import <ABI31_0_0fabric/ABI31_0_0core/Props.h>
#import <ABI31_0_0fabric/ABI31_0_0components/view/ViewEventEmitter.h>
#import <ABI31_0_0fabric/ABI31_0_0events/EventEmitter.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView class for <View> component.
 */
@interface ABI31_0_0RCTViewComponentView : UIView <ABI31_0_0RCTComponentViewProtocol> {
@protected
  facebook::ReactABI31_0_0::LayoutMetrics _layoutMetrics;
  facebook::ReactABI31_0_0::SharedProps _props;
  facebook::ReactABI31_0_0::SharedViewEventEmitter _eventEmitter;
}

/**
 * Represents the `UIView` instance that is being automatically attached to
 * the component view and laid out using on `layoutMetrics` (especially `size`
 * and `padding`) of the component.
 * This view must not be a component view; it's just a convenient way
 * to embed/bridge pure native views as component views.
 * Defaults to `nil`. Assing `nil` to remove view as subview.
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

@end

NS_ASSUME_NONNULL_END
