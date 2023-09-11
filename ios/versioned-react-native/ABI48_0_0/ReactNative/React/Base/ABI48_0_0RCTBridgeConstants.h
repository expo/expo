/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>

/**
 * ABI48_0_0RCTBridgeConstants are constants that are only used in the legacy architecture.
 * Please place constants used in the new architecture into ABI48_0_0RCTConstants.
 */
/**
 * DEPRECATED - Use ABI48_0_0RCTReloadCommand instead. This notification fires just before the bridge starts
 * processing a request to reload.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTBridgeWillReloadNotification;

/**
 * This notification fires whenever a fast refresh happens.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTBridgeFastRefreshNotification;

/**
 * This notification fires just before the bridge begins downloading a script
 * from the packager.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTBridgeWillDownloadScriptNotification;

/**
 * This notification fires just after the bridge finishes downloading a script
 * from the packager.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTBridgeDidDownloadScriptNotification;

/**
 * This notification fires right after the bridge is about to invalidate NativeModule
 * instances during teardown. Handle this notification to perform additional invalidation.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTBridgeWillInvalidateModulesNotification;

/**
 * This notification fires right after the bridge finishes invalidating NativeModule
 * instances during teardown. Handle this notification to perform additional invalidation.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTBridgeDidInvalidateModulesNotification;

/**
 * This notification fires right before the bridge starting invalidation process.
 * Handle this notification to perform additional invalidation.
 * The notification can be issued on any thread.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTBridgeWillBeInvalidatedNotification;

/**
 * Key for the ABI48_0_0RCTSource object in the ABI48_0_0RCTBridgeDidDownloadScriptNotification
 * userInfo dictionary.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTBridgeDidDownloadScriptNotificationSourceKey;

/**
 * Key for the reload reason in the ABI48_0_0RCTBridgeWillReloadNotification userInfo dictionary.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTBridgeDidDownloadScriptNotificationReasonKey;

/**
 * Key for the bridge description (NSString_ in the
 * ABI48_0_0RCTBridgeDidDownloadScriptNotification userInfo dictionary.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTBridgeDidDownloadScriptNotificationBridgeDescriptionKey;
