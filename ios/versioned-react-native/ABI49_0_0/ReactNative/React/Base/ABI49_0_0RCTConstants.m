/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTConstants.h"

NSString *const ABI49_0_0RCTUserInterfaceStyleDidChangeNotification = @"ABI49_0_0RCTUserInterfaceStyleDidChangeNotification";
NSString *const ABI49_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

NSString *const ABI49_0_0RCTJavaScriptDidFailToLoadNotification = @"ABI49_0_0RCTJavaScriptDidFailToLoadNotification";
NSString *const ABI49_0_0RCTJavaScriptDidLoadNotification = @"ABI49_0_0RCTJavaScriptDidLoadNotification";
NSString *const ABI49_0_0RCTJavaScriptWillStartExecutingNotification = @"ABI49_0_0RCTJavaScriptWillStartExecutingNotification";
NSString *const ABI49_0_0RCTJavaScriptWillStartLoadingNotification = @"ABI49_0_0RCTJavaScriptWillStartLoadingNotification";

NSString *const ABI49_0_0RCTDidInitializeModuleNotification = @"ABI49_0_0RCTDidInitializeModuleNotification";
NSString *const ABI49_0_0RCTDidSetupModuleNotification = @"ABI49_0_0RCTDidSetupModuleNotification";
NSString *const ABI49_0_0RCTDidSetupModuleNotificationModuleNameKey = @"moduleName";
NSString *const ABI49_0_0RCTDidSetupModuleNotificationSetupTimeKey = @"setupTime";

/*
 * W3C Pointer Events
 */
static BOOL ABI49_0_0RCTDispatchW3CPointerEvents = NO;

BOOL ABI49_0_0RCTGetDispatchW3CPointerEvents()
{
  return ABI49_0_0RCTDispatchW3CPointerEvents;
}

void ABI49_0_0RCTSetDispatchW3CPointerEvents(BOOL value)
{
  ABI49_0_0RCTDispatchW3CPointerEvents = value;
}

/*
 * Validate ABI49_0_0RCTEventEmitter. For experimentation only.
 */
static BOOL ABI49_0_0RCTValidateCanSendEventInABI49_0_0RCTEventEmitter = NO;

BOOL ABI49_0_0RCTGetValidateCanSendEventInABI49_0_0RCTEventEmitter()
{
  return ABI49_0_0RCTValidateCanSendEventInABI49_0_0RCTEventEmitter;
}

void ABI49_0_0RCTSetValidateCanSendEventInABI49_0_0RCTEventEmitter(BOOL value)
{
  ABI49_0_0RCTValidateCanSendEventInABI49_0_0RCTEventEmitter = value;
}

/*
 * Memory Pressure Unloading Level for experimentation only.
 * Default is 15, which is TRIM_MEMORY_RUNNING_CRITICAL.
 */
static int ABI49_0_0RCTMemoryPressureUnloadLevel = 15;

BOOL ABI49_0_0RCTGetMemoryPressureUnloadLevel()
{
  return ABI49_0_0RCTMemoryPressureUnloadLevel;
}

void ABI49_0_0RCTSetMemoryPressureUnloadLevel(int value)
{
  ABI49_0_0RCTMemoryPressureUnloadLevel = value;
}

/*
 * In Bridge mode, parse the JS stack for unhandled JS errors, to display in RedBox.
 * When false (previous default behavior), a native stack is displayed in the RedBox.
 */
static BOOL ABI49_0_0RCTParseUnhandledJSErrorStackNatively = NO;

BOOL ABI49_0_0RCTGetParseUnhandledJSErrorStackNatively()
{
  return ABI49_0_0RCTParseUnhandledJSErrorStackNatively;
}

void ABI49_0_0RCTSetParseUnhandledJSErrorStackNatively(BOOL value)
{
  ABI49_0_0RCTParseUnhandledJSErrorStackNatively = value;
}
