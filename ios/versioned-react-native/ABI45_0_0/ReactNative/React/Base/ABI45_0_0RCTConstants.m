/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTConstants.h"

NSString *const ABI45_0_0RCTUserInterfaceStyleDidChangeNotification = @"ABI45_0_0RCTUserInterfaceStyleDidChangeNotification";
NSString *const ABI45_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

/*
 * Preemptive View Allocation
 */
static BOOL ABI45_0_0RCTExperimentPreemptiveViewAllocationDisabled = NO;

BOOL ABI45_0_0RCTExperimentGetPreemptiveViewAllocationDisabled()
{
  return ABI45_0_0RCTExperimentPreemptiveViewAllocationDisabled;
}

void ABI45_0_0RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value)
{
  ABI45_0_0RCTExperimentPreemptiveViewAllocationDisabled = value;
}
