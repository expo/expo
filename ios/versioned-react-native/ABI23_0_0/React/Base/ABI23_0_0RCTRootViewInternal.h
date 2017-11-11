/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI23_0_0/ABI23_0_0RCTRootView.h>

@class ABI23_0_0RCTTVRemoteHandler;

/**
 * The interface provides a set of functions that allow other internal framework
 * classes to change the ABI23_0_0RCTRootViews's internal state.
 */
@interface ABI23_0_0RCTRootView ()

/**
 * This setter should be used only by ABI23_0_0RCTUIManager on ReactABI23_0_0 root view
 * intrinsic content size update.
 */
@property (readwrite, nonatomic, assign) CGSize intrinsicContentSize;

/**
 * TV remote gesture recognizers
 */
#if TARGET_OS_TV
@property (nonatomic, strong) ABI23_0_0RCTTVRemoteHandler *tvRemoteHandler;
@property (nonatomic, strong) UIView *ReactABI23_0_0PreferredFocusedView;
#endif

- (void)contentViewInvalidated;

@end
