/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventEmitter.h>

ABI43_0_0RCT_EXTERN void ABI43_0_0RCTEnableAppearancePreference(BOOL enabled);
ABI43_0_0RCT_EXTERN void ABI43_0_0RCTOverrideAppearancePreference(NSString *const);
ABI43_0_0RCT_EXTERN NSString *ABI43_0_0RCTColorSchemePreference(UITraitCollection *traitCollection);

@interface ABI43_0_0RCTAppearance : ABI43_0_0RCTEventEmitter <ABI43_0_0RCTBridgeModule>
@end
