/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTMountingTransactionObserving.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewComponentView.h>

/**
 * UIView class for root <ModalHostView> component.
 */
@interface ABI48_0_0RCTModalHostViewComponentView : ABI48_0_0RCTViewComponentView <ABI48_0_0RCTMountingTransactionObserving>

/**
 * Subclasses may override this method and present the modal on different view controller.
 * Default implementation presents the modal on `[self ABI48_0_0ReactViewController]`.
 */
- (void)presentViewController:(UIViewController *)modalViewController
                     animated:(BOOL)animated
                   completion:(void (^)(void))completion;

/**
 * Subclasses may override this method.
 * Default implementation calls `[UIViewController dismissViewControllerAnimated:completion:]`.
 */
- (void)dismissViewController:(UIViewController *)modalViewController
                     animated:(BOOL)animated
                   completion:(void (^)(void))completion;

@end
