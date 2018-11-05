/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI27_0_0/ABI27_0_0RCTComponent.h>
#import <yogaABI27_0_0/ABI27_0_0YGEnums.h>

@class ABI27_0_0RCTShadowView;

@interface UIView (ReactABI27_0_0) <ABI27_0_0RCTComponent>

/**
 * ABI27_0_0RCTComponent interface.
 */
- (NSArray<UIView *> *)ReactABI27_0_0Subviews NS_REQUIRES_SUPER;
- (UIView *)ReactABI27_0_0Superview NS_REQUIRES_SUPER;
- (void)insertReactABI27_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex NS_REQUIRES_SUPER;
- (void)removeReactABI27_0_0Subview:(UIView *)subview NS_REQUIRES_SUPER;

/**
 * The native id of the view, used to locate view from native codes
 */
@property (nonatomic, copy) NSString *nativeID;

/**
 * Layout direction of the view.
 * Internally backed to `semanticContentAttribute` property.
 * Defaults to `LeftToRight` in case of ambiguity.
 */
@property (nonatomic, assign) UIUserInterfaceLayoutDirection ReactABI27_0_0LayoutDirection;

/**
 * Yoga `display` style property. Can be `flex` or `none`.
 * Defaults to `flex`.
 * May be used to temporary hide the view in a very efficient way.
 */
@property (nonatomic, assign) ABI27_0_0YGDisplay ReactABI27_0_0Display;

/**
 * The z-index of the view.
 */
@property (nonatomic, assign) NSInteger ReactABI27_0_0ZIndex;

/**
 * Subviews sorted by z-index. Note that this method doesn't do any caching (yet)
 * and sorts all the views each call.
 */
- (NSArray<UIView *> *)ReactABI27_0_0ZIndexSortedSubviews;

/**
 * Updates the subviews array based on the ReactABI27_0_0Subviews. Default behavior is
 * to insert the sortedReactABI27_0_0Subviews into the UIView.
 */
- (void)didUpdateReactABI27_0_0Subviews;

/**
 * Called each time props have been set.
 * The default implementation does nothing.
 */
- (void)didSetProps:(NSArray<NSString *> *)changedProps;

/**
 * Used by the UIIManager to set the view frame.
 * May be overriden to disable animation, etc.
 */
- (void)ReactABI27_0_0SetFrame:(CGRect)frame;

/**
 * This method finds and returns the containing view controller for the view.
 */
- (UIViewController *)ReactABI27_0_0ViewController;

/**
 * This method attaches the specified controller as a child of the
 * the owning view controller of this view. Returns NO if no view
 * controller is found (which may happen if the view is not currently
 * attached to the view hierarchy).
 */
- (void)ReactABI27_0_0AddControllerToClosestParent:(UIViewController *)controller;

/**
 * Focus manipulation.
 */
- (void)ReactABI27_0_0Focus;
- (void)ReactABI27_0_0FocusIfNeeded;
- (void)ReactABI27_0_0Blur;

/**
 * Useful properties for computing layout.
 */
@property (nonatomic, readonly) UIEdgeInsets ReactABI27_0_0BorderInsets;
@property (nonatomic, readonly) UIEdgeInsets ReactABI27_0_0PaddingInsets;
@property (nonatomic, readonly) UIEdgeInsets ReactABI27_0_0CompoundInsets;
@property (nonatomic, readonly) CGRect ReactABI27_0_0ContentFrame;

/**
 * The (sub)view which represents this view in terms of accessibility.
 * ViewManager will apply all accessibility properties directly to this view.
 * May be overriten in view subclass which needs to be accessiblitywise
 * transparent in favour of some subview.
 * Defaults to `self`.
 */
@property (nonatomic, readonly) UIView *ReactABI27_0_0AccessibilityElement;

@end
