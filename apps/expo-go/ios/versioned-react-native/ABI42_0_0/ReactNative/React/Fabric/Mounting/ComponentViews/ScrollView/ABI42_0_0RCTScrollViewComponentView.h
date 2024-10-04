/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTGenericDelegateSplitter.h>
#import <ABI42_0_0React/ABI42_0_0RCTScrollableProtocol.h>
#import <ABI42_0_0React/ABI42_0_0RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * UIView class for <ScrollView> component.
 *
 * By design, the class does not implement any logic that contradicts to the normal behavior of UIScrollView and does
 * not contain any special/custom support for things like floating headers, pull-to-refresh components,
 * keyboard-avoiding functionality and so on. All that complexity must be implemented inside those components in order
 * to keep the complexity of this component manageable.
 */
@interface ABI42_0_0RCTScrollViewComponentView : ABI42_0_0RCTViewComponentView

/*
 * Finds and returns the closet ABI42_0_0RCTScrollViewComponentView component to the given view
 */
+ (ABI42_0_0RCTScrollViewComponentView *_Nullable)findScrollViewComponentViewForView:(UIView *)view;

/*
 * Returns an actual UIScrollView that this component uses under the hood.
 */
@property (nonatomic, strong, readonly) UIScrollView *scrollView;

/*
 * Returns the subview of the scroll view that the component uses to mount all subcomponents into. That's useful to
 * separate component views from auxiliary views to be able to reliably implement pull-to-refresh- and RTL-related
 * functionality.
 */
@property (nonatomic, strong, readonly) UIView *containerView;

/*
 * Returns a delegate splitter that can be used to subscribe for UIScrollView delegate.
 */
@property (nonatomic, strong, readonly)
    ABI42_0_0RCTGenericDelegateSplitter<id<UIScrollViewDelegate>> *scrollViewDelegateSplitter;

@end

/*
 * ABI42_0_0RCTScrollableProtocol is a protocol which ABI42_0_0RCTScrollViewManager uses to communicate with all kinds of `UIScrollView`s.
 * Until Fabric has own command-execution pipeline we have to support that to some extent. The implementation shouldn't
 * be perfect though because very soon we will migrate that to the new commands infra and get rid of this.
 */
@interface ABI42_0_0RCTScrollViewComponentView (ScrollableProtocol) <ABI42_0_0RCTScrollableProtocol>

@end

NS_ASSUME_NONNULL_END
