/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTConstants.h"

NSString *const ABI43_0_0RCTUserInterfaceStyleDidChangeNotification = @"ABI43_0_0RCTUserInterfaceStyleDidChangeNotification";
NSString *const ABI43_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey = @"traitCollection";

/*
 * On-demand view mounting
 */
static BOOL ABI43_0_0RCTExperimentOnDemandViewMounting = NO;

BOOL ABI43_0_0RCTExperimentGetOnDemandViewMounting()
{
  return ABI43_0_0RCTExperimentOnDemandViewMounting;
}

void ABI43_0_0RCTExperimentSetOnDemandViewMounting(BOOL value)
{
  ABI43_0_0RCTExperimentOnDemandViewMounting = value;
}

/*
 * Optimized hit-testing
 */
static BOOL ABI43_0_0RCTExperimentOptimizedHitTesting = NO;

BOOL ABI43_0_0RCTExperimentGetOptimizedHitTesting()
{
  return ABI43_0_0RCTExperimentOptimizedHitTesting;
}

void ABI43_0_0RCTExperimentSetOptimizedHitTesting(BOOL value)
{
  ABI43_0_0RCTExperimentOptimizedHitTesting = value;
}

/*
 * Preemptive View Allocation
 */
static BOOL ABI43_0_0RCTExperimentPreemptiveViewAllocationDisabled = NO;

BOOL ABI43_0_0RCTExperimentGetPreemptiveViewAllocationDisabled()
{
  return ABI43_0_0RCTExperimentPreemptiveViewAllocationDisabled;
}

void ABI43_0_0RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value)
{
  ABI43_0_0RCTExperimentPreemptiveViewAllocationDisabled = value;
}
