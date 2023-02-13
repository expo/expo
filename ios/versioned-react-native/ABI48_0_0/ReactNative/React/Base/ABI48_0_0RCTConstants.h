/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>

ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTUserInterfaceStyleDidChangeNotification;
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey;

/**
 * This notification fires when the bridge initializes.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTJavaScriptWillStartLoadingNotification;

/**
 * This notification fires when the bridge starts executing the JS bundle.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTJavaScriptWillStartExecutingNotification;

/**
 * This notification fires when the bridge has finished loading the JS bundle.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTJavaScriptDidLoadNotification;

/**
 * This notification fires when the bridge failed to load the JS bundle. The
 * `error` key can be used to determine the error that occurred.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTJavaScriptDidFailToLoadNotification;

/**
 * This notification fires each time a native module is instantiated. The
 * `module` key will contain a reference to the newly-created module instance.
 * Note that this notification may be fired before the module is available via
 * the `[bridge moduleForClass:]` method.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTDidInitializeModuleNotification;

/**
 * This notification fires each time a module is setup after it is initialized. The
 * `ABI48_0_0RCTDidSetupModuleNotificationModuleNameKey` key will contain a reference to the module name and
 * `ABI48_0_0RCTDidSetupModuleNotificationSetupTimeKey` will contain the setup time in ms.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTDidSetupModuleNotification;

/**
 * Key for the module name (NSString) in the
 * ABI48_0_0RCTDidSetupModuleNotification userInfo dictionary.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTDidSetupModuleNotificationModuleNameKey;

/**
 * Key for the setup time (NSNumber) in the
 * ABI48_0_0RCTDidSetupModuleNotification userInfo dictionary.
 */
ABI48_0_0RCT_EXTERN NSString *const ABI48_0_0RCTDidSetupModuleNotificationSetupTimeKey;

/*
 * W3C Pointer Events
 */
ABI48_0_0RCT_EXTERN BOOL ABI48_0_0RCTGetDispatchW3CPointerEvents(void);
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTSetDispatchW3CPointerEvents(BOOL value);

/*
 * Validate ABI48_0_0RCTEventEmitter
 */
ABI48_0_0RCT_EXTERN BOOL ABI48_0_0RCTGetValidateCanSendEventInABI48_0_0RCTEventEmitter(void);
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTSetValidateCanSendEventInABI48_0_0RCTEventEmitter(BOOL value);

/*
 * Memory Pressure Unloading Level
 */
ABI48_0_0RCT_EXTERN BOOL ABI48_0_0RCTGetMemoryPressureUnloadLevel(void);
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTSetMemoryPressureUnloadLevel(int value);

/*
 * Parse JS stack for unhandled JS errors caught in C++
 */
ABI48_0_0RCT_EXTERN BOOL ABI48_0_0RCTGetParseUnhandledJSErrorStackNatively(void);
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTSetParseUnhandledJSErrorStackNatively(BOOL value);
