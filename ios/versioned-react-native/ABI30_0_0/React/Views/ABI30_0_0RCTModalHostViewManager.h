/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI30_0_0/ABI30_0_0RCTInvalidating.h>
#import <ReactABI30_0_0/ABI30_0_0RCTViewManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>

@interface ABI30_0_0RCTConvert (ABI30_0_0RCTModalHostView)

+ (UIModalPresentationStyle)UIModalPresentationStyle:(id)json;

@end

typedef void (^ABI30_0_0RCTModalViewInteractionBlock)(UIViewController *ReactABI30_0_0ViewController, UIViewController *viewController, BOOL animated, dispatch_block_t completionBlock);

@interface ABI30_0_0RCTModalHostViewManager : ABI30_0_0RCTViewManager <ABI30_0_0RCTInvalidating>

/**
 * `presentationBlock` and `dismissalBlock` allow you to control how a Modal interacts with your case,
 * e.g. in case you have a native navigator that has its own way to display a modal.
 * If these are not specified, it falls back to the UIViewController standard way of presenting.
 */
@property (nonatomic, strong) ABI30_0_0RCTModalViewInteractionBlock presentationBlock;
@property (nonatomic, strong) ABI30_0_0RCTModalViewInteractionBlock dismissalBlock;

@end
