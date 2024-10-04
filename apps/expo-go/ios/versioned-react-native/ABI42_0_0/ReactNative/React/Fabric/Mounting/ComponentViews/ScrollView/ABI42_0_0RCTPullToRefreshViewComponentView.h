/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * UIView class for root <PullToRefreshView> component.
 * This view is designed to only serve ViewController-like purpose for the actual `UIRefreshControl` view which is being
 * attached to some `UIScrollView` (not to this view).
 */
@interface ABI42_0_0RCTPullToRefreshViewComponentView : ABI42_0_0RCTViewComponentView

@end

NS_ASSUME_NONNULL_END
