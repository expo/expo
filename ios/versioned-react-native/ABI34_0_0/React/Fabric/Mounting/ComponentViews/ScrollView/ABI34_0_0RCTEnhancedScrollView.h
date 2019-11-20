/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * `UIScrollView` subclass which has some improvements and tweaks
 * wich are not directly related to ReactABI34_0_0.
 */
@interface ABI34_0_0RCTEnhancedScrollView : UIScrollView

@property (nonatomic, assign) BOOL pinchGestureEnabled;
@property (nonatomic, assign) BOOL centerContent;

@end

NS_ASSUME_NONNULL_END
