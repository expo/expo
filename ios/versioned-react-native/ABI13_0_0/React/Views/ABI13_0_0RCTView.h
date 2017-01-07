/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI13_0_0/ABI13_0_0RCTBorderStyle.h>
#import <ReactABI13_0_0/ABI13_0_0RCTComponent.h>
#import <ReactABI13_0_0/ABI13_0_0RCTPointerEvents.h>
#import <ReactABI13_0_0/ABI13_0_0RCTView.h>

@protocol ABI13_0_0RCTAutoInsetsProtocol;

@class ABI13_0_0RCTView;

@interface ABI13_0_0RCTView : UIView

/**
 * Accessibility event handlers
 */
@property (nonatomic, copy) ABI13_0_0RCTDirectEventBlock onAccessibilityTap;
@property (nonatomic, copy) ABI13_0_0RCTDirectEventBlock onMagicTap;

/**
 * Used to control how touch events are processed.
 */
@property (nonatomic, assign) ABI13_0_0RCTPointerEvents pointerEvents;

+ (void)autoAdjustInsetsForView:(UIView<ABI13_0_0RCTAutoInsetsProtocol> *)parentView
                 withScrollView:(UIScrollView *)scrollView
                   updateOffset:(BOOL)updateOffset;

/**
 * Find the first view controller whose view, or any subview is the specified view.
 */
+ (UIEdgeInsets)contentInsetsForView:(UIView *)curView;

/**
 * z-index, used to override sibling order in didUpdateReactABI13_0_0Subviews. This is
 * inherited from UIView+ReactABI13_0_0, but we override it here to reduce the boxing
 * and associated object overheads.
 */
@property (nonatomic, assign) NSInteger ReactABI13_0_0ZIndex;

/**
 * This is an optimization used to improve performance
 * for large scrolling views with many subviews, such as a
 * list or table. If set to YES, any clipped subviews will
 * be removed from the view hierarchy whenever -updateClippedSubviews
 * is called. This would typically be triggered by a scroll event
 */
@property (nonatomic, assign) BOOL removeClippedSubviews;

/**
 * Hide subviews if they are outside the view bounds.
 * This is an optimisation used predominantly with RKScrollViews
 * but it is applied recursively to all subviews that have
 * removeClippedSubviews set to YES
 */
- (void)updateClippedSubviews;

/**
 * Border radii.
 */
@property (nonatomic, assign) CGFloat borderRadius;
@property (nonatomic, assign) CGFloat borderTopLeftRadius;
@property (nonatomic, assign) CGFloat borderTopRightRadius;
@property (nonatomic, assign) CGFloat borderBottomLeftRadius;
@property (nonatomic, assign) CGFloat borderBottomRightRadius;

/**
 * Border colors (actually retained).
 */
@property (nonatomic, assign) CGColorRef borderTopColor;
@property (nonatomic, assign) CGColorRef borderRightColor;
@property (nonatomic, assign) CGColorRef borderBottomColor;
@property (nonatomic, assign) CGColorRef borderLeftColor;
@property (nonatomic, assign) CGColorRef borderColor;

/**
 * Border widths.
 */
@property (nonatomic, assign) CGFloat borderTopWidth;
@property (nonatomic, assign) CGFloat borderRightWidth;
@property (nonatomic, assign) CGFloat borderBottomWidth;
@property (nonatomic, assign) CGFloat borderLeftWidth;
@property (nonatomic, assign) CGFloat borderWidth;

/**
 * Border styles.
 */
@property (nonatomic, assign) ABI13_0_0RCTBorderStyle borderStyle;

/**
 *  Insets used when hit testing inside this view.
 */
@property (nonatomic, assign) UIEdgeInsets hitTestEdgeInsets;

@end
