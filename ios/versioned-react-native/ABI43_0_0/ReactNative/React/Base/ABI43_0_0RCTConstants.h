/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTDefines.h>

ABI43_0_0RCT_EXTERN NSString *const ABI43_0_0RCTUserInterfaceStyleDidChangeNotification;
ABI43_0_0RCT_EXTERN NSString *const ABI43_0_0RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey;

/*
 * Allows to enable or disable on-demand view mounting feature of ScrollView.
 * It's an experimental feature that improves performance and memory footprint of huge lists inside ScrollView.
 */
ABI43_0_0RCT_EXTERN BOOL ABI43_0_0RCTExperimentGetOnDemandViewMounting(void);
ABI43_0_0RCT_EXTERN void ABI43_0_0RCTExperimentSetOnDemandViewMounting(BOOL value);

/*
 * It's an experimental feature that improves performance of hit-testing.
 */
ABI43_0_0RCT_EXTERN BOOL ABI43_0_0RCTExperimentGetOptimizedHitTesting(void);
ABI43_0_0RCT_EXTERN void ABI43_0_0RCTExperimentSetOptimizedHitTesting(BOOL value);

/*
 * Preemptive View Allocation
 */
ABI43_0_0RCT_EXTERN BOOL ABI43_0_0RCTExperimentGetPreemptiveViewAllocationDisabled(void);
ABI43_0_0RCT_EXTERN void ABI43_0_0RCTExperimentSetPreemptiveViewAllocationDisabled(BOOL value);
