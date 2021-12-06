/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTBridgeModule.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventEmitter.h>

ABI44_0_0RCT_EXTERN void ABI44_0_0RCTEnableAppearancePreference(BOOL enabled);
ABI44_0_0RCT_EXTERN void ABI44_0_0RCTOverrideAppearancePreference(NSString *const);
ABI44_0_0RCT_EXTERN NSString *ABI44_0_0RCTColorSchemePreference(UITraitCollection *traitCollection);

@interface ABI44_0_0RCTAppearance : ABI44_0_0RCTEventEmitter <ABI44_0_0RCTBridgeModule>
@end
