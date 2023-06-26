/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventEmitter.h>

ABI49_0_0RCT_EXTERN void ABI49_0_0RCTEnableAppearancePreference(BOOL enabled);
ABI49_0_0RCT_EXTERN void ABI49_0_0RCTOverrideAppearancePreference(NSString *const);
ABI49_0_0RCT_EXTERN NSString *ABI49_0_0RCTCurrentOverrideAppearancePreference();
ABI49_0_0RCT_EXTERN NSString *ABI49_0_0RCTColorSchemePreference(UITraitCollection *traitCollection);

@interface ABI49_0_0RCTAppearance : ABI49_0_0RCTEventEmitter <ABI49_0_0RCTBridgeModule>
@end
