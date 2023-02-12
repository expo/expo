/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI46_0_0React/ABI46_0_0RCTBridgeModule.h>
#import <ABI46_0_0React/ABI46_0_0RCTEventEmitter.h>

ABI46_0_0RCT_EXTERN void ABI46_0_0RCTEnableAppearancePreference(BOOL enabled);
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTOverrideAppearancePreference(NSString *const);
ABI46_0_0RCT_EXTERN NSString *ABI46_0_0RCTCurrentOverrideAppearancePreference();
ABI46_0_0RCT_EXTERN NSString *ABI46_0_0RCTColorSchemePreference(UITraitCollection *traitCollection);

@interface ABI46_0_0RCTAppearance : ABI46_0_0RCTEventEmitter <ABI46_0_0RCTBridgeModule>
@end
