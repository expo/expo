/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>

/**
 * A protocol which should be conformed to in order to be notified of ABI48_0_0RN reload events. These events can be
 * created by CMD+R or dev menu during development, or anywhere the trigger is exposed to JS.
 * The listener must also register itself using the method below.
 */
@protocol ABI48_0_0RCTReloadListener
- (void)didReceiveReloadCommand;
@end

/**
 * Registers a weakly-held observer of ABI48_0_0RN reload events.
 */
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTRegisterReloadCommandListener(id<ABI48_0_0RCTReloadListener> listener);

/**
 * Triggers a reload for all current listeners. Replaces [_bridge reload].
 */
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTTriggerReloadCommandListeners(NSString *reason);

/**
 * This notification fires anytime ABI48_0_0RCTTriggerReloadCommandListeners() is called.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTTriggerReloadCommandNotification;
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTTriggerReloadCommandReasonKey;
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTTriggerReloadCommandBundleURLKey;

ABI48_0_0RCT_EXTERN void ABI48_0_0RCTReloadCommandSetBundleURL(NSURL *URL);
