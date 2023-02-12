/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTConstants.h"

NSString *const ABI48_0_0RCTUserInterfaceStyleDidChangeNotification = @"ABI48_0_0RCTUserInterfaceStyleDidChangeNotification";
NSString *const ABI48_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

NSString *const ABI48_0_0RCTJavaScriptDidFailToLoadNotification = @"ABI48_0_0RCTJavaScriptDidFailToLoadNotification";
NSString *const ABI48_0_0RCTJavaScriptDidLoadNotification = @"ABI48_0_0RCTJavaScriptDidLoadNotification";
NSString *const ABI48_0_0RCTJavaScriptWillStartExecutingNotification = @"ABI48_0_0RCTJavaScriptWillStartExecutingNotification";
NSString *const ABI48_0_0RCTJavaScriptWillStartLoadingNotification = @"ABI48_0_0RCTJavaScriptWillStartLoadingNotification";

NSString *const ABI48_0_0RCTDidInitializeModuleNotification = @"ABI48_0_0RCTDidInitializeModuleNotification";
NSString *const ABI48_0_0RCTDidSetupModuleNotification = @"ABI48_0_0RCTDidSetupModuleNotification";
NSString *const ABI48_0_0RCTDidSetupModuleNotificationModuleNameKey = @"moduleName";
NSString *const ABI48_0_0RCTDidSetupModuleNotificationSetupTimeKey = @"setupTime";

/*
 * W3C Pointer Events
 */
static BOOL ABI48_0_0RCTDispatchW3CPointerEvents = NO;

BOOL ABI48_0_0RCTGetDispatchW3CPointerEvents()
{
  return ABI48_0_0RCTDispatchW3CPointerEvents;
}

void ABI48_0_0RCTSetDispatchW3CPointerEvents(BOOL value)
{
  ABI48_0_0RCTDispatchW3CPointerEvents = value;
}

/*
 * Validate ABI48_0_0RCTEventEmitter. For experimentation only.
 */
static BOOL ABI48_0_0RCTValidateCanSendEventInABI48_0_0RCTEventEmitter = NO;

BOOL ABI48_0_0RCTGetValidateCanSendEventInABI48_0_0RCTEventEmitter()
{
  return ABI48_0_0RCTValidateCanSendEventInABI48_0_0RCTEventEmitter;
}

void ABI48_0_0RCTSetValidateCanSendEventInABI48_0_0RCTEventEmitter(BOOL value)
{
  ABI48_0_0RCTValidateCanSendEventInABI48_0_0RCTEventEmitter = value;
}

/*
 * Memory Pressure Unloading Level for experimentation only.
 * Default is 15, which is TRIM_MEMORY_RUNNING_CRITICAL.
 */
static int ABI48_0_0RCTMemoryPressureUnloadLevel = 15;

BOOL ABI48_0_0RCTGetMemoryPressureUnloadLevel()
{
  return ABI48_0_0RCTMemoryPressureUnloadLevel;
}

void ABI48_0_0RCTSetMemoryPressureUnloadLevel(int value)
{
  ABI48_0_0RCTMemoryPressureUnloadLevel = value;
}

/*
 * In Bridge mode, parse the JS stack for unhandled JS errors, to display in RedBox.
 * When false (previous default behavior), a native stack is displayed in the RedBox.
 */
static BOOL ABI48_0_0RCTParseUnhandledJSErrorStackNatively = NO;

BOOL ABI48_0_0RCTGetParseUnhandledJSErrorStackNatively()
{
  return ABI48_0_0RCTParseUnhandledJSErrorStackNatively;
}

void ABI48_0_0RCTSetParseUnhandledJSErrorStackNatively(BOOL value)
{
  ABI48_0_0RCTParseUnhandledJSErrorStackNatively = value;
}
