/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventEmitter.h>

ABI38_0_0RCT_EXTERN void ABI38_0_0RCTEnableAppearancePreference(BOOL enabled);

@interface ABI38_0_0RCTAppearance : ABI38_0_0RCTEventEmitter <ABI38_0_0RCTBridgeModule>
@end
