/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTDefines.h>

ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTUserInterfaceStyleDidChangeNotification;
ABI47_0_0RCT_EXTERN NSString *const ABI47_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey;

/*
 * Preemptive View Allocation
 */
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTExperimentGetPreemptiveViewAllocationDisabled(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value);

/*
 * W3C Pointer Events
 */
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTGetDispatchW3CPointerEvents(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTSetDispatchW3CPointerEvents(BOOL value);

/*
 * Validate ABI47_0_0RCTEventEmitter
 */
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTGetValidateCanSendEventInABI47_0_0RCTEventEmitter(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTSetValidateCanSendEventInABI47_0_0RCTEventEmitter(BOOL value);

/*
 * Memory Pressure Unloading Level
 */
ABI47_0_0RCT_EXTERN BOOL ABI47_0_0RCTGetMemoryPressureUnloadLevel(void);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTSetMemoryPressureUnloadLevel(int value);
