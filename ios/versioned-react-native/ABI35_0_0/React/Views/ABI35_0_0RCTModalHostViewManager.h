/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI35_0_0/ABI35_0_0RCTInvalidating.h>
#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert.h>

@interface ABI35_0_0RCTConvert (ABI35_0_0RCTModalHostView)

+ (UIModalPresentationStyle)UIModalPresentationStyle:(id)json;

@end

typedef void (^ABI35_0_0RCTModalViewInteractionBlock)(UIViewController *ReactABI35_0_0ViewController, UIViewController *viewController, BOOL animated, dispatch_block_t completionBlock);

@interface ABI35_0_0RCTModalHostViewManager : ABI35_0_0RCTViewManager <ABI35_0_0RCTInvalidating>

/**
 * `presentationBlock` and `dismissalBlock` allow you to control how a Modal interacts with your case,
 * e.g. in case you have a native navigator that has its own way to display a modal.
 * If these are not specified, it falls back to the UIViewController standard way of presenting.
 */
@property (nonatomic, strong) ABI35_0_0RCTModalViewInteractionBlock presentationBlock;
@property (nonatomic, strong) ABI35_0_0RCTModalViewInteractionBlock dismissalBlock;

@end
