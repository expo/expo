/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventEmitter.h>

ABI42_0_0RCT_EXTERN void ABI42_0_0RCTEnableAppearancePreference(BOOL enabled);
ABI42_0_0RCT_EXTERN void ABI42_0_0RCTOverrideAppearancePreference(NSString *const);

@interface ABI42_0_0RCTAppearance : ABI42_0_0RCTEventEmitter <ABI42_0_0RCTBridgeModule>
@end
