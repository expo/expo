/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * `UIScrollView` subclass which has some improvements and tweaks
 * which are not directly related to ABI37_0_0React.
 */
@interface ABI37_0_0RCTEnhancedScrollView : UIScrollView

@property (nonatomic, assign) BOOL pinchGestureEnabled;
@property (nonatomic, assign) BOOL centerContent;

@end

NS_ASSUME_NONNULL_END
