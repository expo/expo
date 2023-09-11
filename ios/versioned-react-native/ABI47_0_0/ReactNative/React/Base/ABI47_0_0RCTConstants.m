/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTConstants.h"

NSString *const ABI47_0_0RCTUserInterfaceStyleDidChangeNotification = @"ABI47_0_0RCTUserInterfaceStyleDidChangeNotification";
NSString *const ABI47_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

/*
 * Preemptive View Allocation
 */
static BOOL ABI47_0_0RCTExperimentPreemptiveViewAllocationDisabled = NO;

BOOL ABI47_0_0RCTExperimentGetPreemptiveViewAllocationDisabled()
{
  return ABI47_0_0RCTExperimentPreemptiveViewAllocationDisabled;
}

void ABI47_0_0RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value)
{
  ABI47_0_0RCTExperimentPreemptiveViewAllocationDisabled = value;
}

/*
 * W3C Pointer Events
 */
static BOOL ABI47_0_0RCTDispatchW3CPointerEvents = NO;

BOOL ABI47_0_0RCTGetDispatchW3CPointerEvents()
{
  return ABI47_0_0RCTDispatchW3CPointerEvents;
}

void ABI47_0_0RCTSetDispatchW3CPointerEvents(BOOL value)
{
  ABI47_0_0RCTDispatchW3CPointerEvents = value;
}

/*
 * Validate ABI47_0_0RCTEventEmitter. For experimentation only.
 */
static BOOL ABI47_0_0RCTValidateCanSendEventInABI47_0_0RCTEventEmitter = NO;

BOOL ABI47_0_0RCTGetValidateCanSendEventInABI47_0_0RCTEventEmitter()
{
  return ABI47_0_0RCTValidateCanSendEventInABI47_0_0RCTEventEmitter;
}

void ABI47_0_0RCTSetValidateCanSendEventInABI47_0_0RCTEventEmitter(BOOL value)
{
  ABI47_0_0RCTValidateCanSendEventInABI47_0_0RCTEventEmitter = value;
}

/*
 * Memory Pressure Unloading Level for experimentation only.
 * Default is 15, which is TRIM_MEMORY_RUNNING_CRITICAL.
 */
static int ABI47_0_0RCTMemoryPressureUnloadLevel = 15;

BOOL ABI47_0_0RCTGetMemoryPressureUnloadLevel()
{
  return ABI47_0_0RCTMemoryPressureUnloadLevel;
}

void ABI47_0_0RCTSetMemoryPressureUnloadLevel(int value)
{
  ABI47_0_0RCTMemoryPressureUnloadLevel = value;
}
