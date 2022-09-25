/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventEmitter.h>

ABI45_0_0RCT_EXTERN void ABI45_0_0RCTEnableAppearancePreference(BOOL enabled);
ABI45_0_0RCT_EXTERN void ABI45_0_0RCTOverrideAppearancePreference(NSString *const);
ABI45_0_0RCT_EXTERN NSString *ABI45_0_0RCTCurrentOverrideAppearancePreference();
ABI45_0_0RCT_EXTERN NSString *ABI45_0_0RCTColorSchemePreference(UITraitCollection *traitCollection);

@interface ABI45_0_0RCTAppearance : ABI45_0_0RCTEventEmitter <ABI45_0_0RCTBridgeModule>
@end
