/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventEmitter.h>

ABI47_0_0RCT_EXTERN void ABI47_0_0RCTEnableAppearancePreference(BOOL enabled);
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTOverrideAppearancePreference(NSString *const);
ABI47_0_0RCT_EXTERN NSString *ABI47_0_0RCTCurrentOverrideAppearancePreference();
ABI47_0_0RCT_EXTERN NSString *ABI47_0_0RCTColorSchemePreference(UITraitCollection *traitCollection);

@interface ABI47_0_0RCTAppearance : ABI47_0_0RCTEventEmitter <ABI47_0_0RCTBridgeModule>
@end
