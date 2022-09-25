/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTDefines.h>

ABI46_0_0RCT_EXTERN NSString *const ABI46_0_0RCTUserInterfaceStyleDidChangeNotification;
ABI46_0_0RCT_EXTERN NSString *const ABI46_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey;

/*
 * Preemptive View Allocation
 */
ABI46_0_0RCT_EXTERN BOOL ABI46_0_0RCTExperimentGetPreemptiveViewAllocationDisabled(void);
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value);

/*
 * W3C Pointer Events
 */
ABI46_0_0RCT_EXTERN BOOL ABI46_0_0RCTGetDispatchW3CPointerEvents(void);
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTSetDispatchW3CPointerEvents(BOOL value);

/*
 * Memory Pressure Unloading
 */
ABI46_0_0RCT_EXTERN BOOL ABI46_0_0RCTGetDisableBridgeMemoryPressureUnload(void);
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTSetDisableBridgeMemoryPressureUnload(BOOL value);

/*
 * Memory Pressure Unloading Level
 */
ABI46_0_0RCT_EXTERN BOOL ABI46_0_0RCTGetMemoryPressureUnloadLevel(void);
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTSetMemoryPressureUnloadLevel(int value);
