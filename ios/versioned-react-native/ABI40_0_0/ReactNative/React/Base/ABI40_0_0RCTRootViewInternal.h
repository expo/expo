/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTRootView.h>

@class ABI40_0_0RCTTVRemoteHandler;

/**
 * The interface provides a set of functions that allow other internal framework
 * classes to change the ABI40_0_0RCTRootViews's internal state.
 */
@interface ABI40_0_0RCTRootView ()

/**
 * This setter should be used only by ABI40_0_0RCTUIManager on ABI40_0_0React root view
 * intrinsic content size update.
 */
@property (readwrite, nonatomic, assign) CGSize intrinsicContentSize;

/**
 * TV remote gesture recognizers
 */
#if TARGET_OS_TV
@property (nonatomic, strong) ABI40_0_0RCTTVRemoteHandler *tvRemoteHandler;
@property (nonatomic, strong) UIView *ABI40_0_0ReactPreferredFocusedView;
#endif

- (void)contentViewInvalidated;

@end
