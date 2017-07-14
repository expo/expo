/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI19_0_0/ABI19_0_0RCTInvalidating.h>
#import <ReactABI19_0_0/ABI19_0_0RCTViewManager.h>

typedef void (^ABI19_0_0RCTModalViewInteractionBlock)(UIViewController *ReactABI19_0_0ViewController, UIViewController *viewController, BOOL animated, dispatch_block_t completionBlock);

@interface ABI19_0_0RCTModalHostViewManager : ABI19_0_0RCTViewManager <ABI19_0_0RCTInvalidating>

/**
 * `presentationBlock` and `dismissalBlock` allow you to control how a Modal interacts with your case,
 * e.g. in case you have a native navigator that has its own way to display a modal.
 * If these are not specified, it falls back to the UIViewController standard way of presenting.
 */
@property (nonatomic, strong) ABI19_0_0RCTModalViewInteractionBlock presentationBlock;
@property (nonatomic, strong) ABI19_0_0RCTModalViewInteractionBlock dismissalBlock;

@end
