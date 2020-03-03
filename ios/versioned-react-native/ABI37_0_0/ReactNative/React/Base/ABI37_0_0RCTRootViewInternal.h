/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTRootView.h>

@class ABI37_0_0RCTTVRemoteHandler;

/**
 * The interface provides a set of functions that allow other internal framework
 * classes to change the ABI37_0_0RCTRootViews's internal state.
 */
@interface ABI37_0_0RCTRootView ()

/**
 * This setter should be used only by ABI37_0_0RCTUIManager on ABI37_0_0React root view
 * intrinsic content size update.
 */
@property (readwrite, nonatomic, assign) CGSize intrinsicContentSize;

/**
 * TV remote gesture recognizers
 */
#if TARGET_OS_TV
@property (nonatomic, strong) ABI37_0_0RCTTVRemoteHandler *tvRemoteHandler;
@property (nonatomic, strong) UIView *ABI37_0_0ReactPreferredFocusedView;
#endif

- (void)contentViewInvalidated;

@end
