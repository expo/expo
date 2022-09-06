/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTConstants.h"

NSString *const ABI46_0_0RCTUserInterfaceStyleDidChangeNotification = @"ABI46_0_0RCTUserInterfaceStyleDidChangeNotification";
NSString *const ABI46_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

/*
 * Preemptive View Allocation
 */
static BOOL ABI46_0_0RCTExperimentPreemptiveViewAllocationDisabled = NO;

BOOL ABI46_0_0RCTExperimentGetPreemptiveViewAllocationDisabled()
{
  return ABI46_0_0RCTExperimentPreemptiveViewAllocationDisabled;
}

void ABI46_0_0RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value)
{
  ABI46_0_0RCTExperimentPreemptiveViewAllocationDisabled = value;
}

/*
 * W3C Pointer Events
 */
static BOOL ABI46_0_0RCTDispatchW3CPointerEvents = NO;

BOOL ABI46_0_0RCTGetDispatchW3CPointerEvents()
{
  return ABI46_0_0RCTDispatchW3CPointerEvents;
}

void ABI46_0_0RCTSetDispatchW3CPointerEvents(BOOL value)
{
  ABI46_0_0RCTDispatchW3CPointerEvents = value;
}

/*
 * Memory Pressure Unloading
 */
static BOOL ABI46_0_0RCTDisableBridgeMemoryPressureUnload = NO;

BOOL ABI46_0_0RCTGetDisableBridgeMemoryPressureUnload()
{
  return ABI46_0_0RCTDisableBridgeMemoryPressureUnload;
}

void ABI46_0_0RCTSetDisableBridgeMemoryPressureUnload(BOOL value)
{
  ABI46_0_0RCTDisableBridgeMemoryPressureUnload = value;
}

/*
 * Memory Pressure Unloading Level for experimentation only.
 * Default is 15, which is TRIM_MEMORY_RUNNING_CRITICAL.
 */
static int ABI46_0_0RCTMemoryPressureUnloadLevel = 15;

BOOL ABI46_0_0RCTGetMemoryPressureUnloadLevel()
{
  return ABI46_0_0RCTMemoryPressureUnloadLevel;
}

void ABI46_0_0RCTSetMemoryPressureUnloadLevel(int value)
{
  ABI46_0_0RCTMemoryPressureUnloadLevel = value;
}
