/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventEmitter.h>

ABI48_0_0RCT_EXTERN void ABI48_0_0RCTEnableAppearancePreference(BOOL enabled);
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTOverrideAppearancePreference(NSString *const);
ABI48_0_0RCT_EXTERN NSString *ABI48_0_0RCTCurrentOverrideAppearancePreference();
ABI48_0_0RCT_EXTERN NSString *ABI48_0_0RCTColorSchemePreference(UITraitCollection *traitCollection);

@interface ABI48_0_0RCTAppearance : ABI48_0_0RCTEventEmitter <ABI48_0_0RCTBridgeModule>
@end
