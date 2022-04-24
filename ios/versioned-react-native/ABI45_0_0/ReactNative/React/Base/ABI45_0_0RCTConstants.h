/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTDefines.h>

ABI45_0_0RCT_EXTERN NSString *const ABI45_0_0RCTUserInterfaceStyleDidChangeNotification;
ABI45_0_0RCT_EXTERN NSString *const ABI45_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey;

/*
 * Preemptive View Allocation
 */
ABI45_0_0RCT_EXTERN BOOL ABI45_0_0RCTExperimentGetPreemptiveViewAllocationDisabled(void);
ABI45_0_0RCT_EXTERN void ABI45_0_0RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value);
