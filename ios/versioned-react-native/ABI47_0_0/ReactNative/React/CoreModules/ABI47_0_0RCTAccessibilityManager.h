/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>

extern NSString *const ABI47_0_0RCTAccessibilityManagerDidUpdateMultiplierNotification; // posted when multiplier is changed

@interface ABI47_0_0RCTAccessibilityManager : NSObject <ABI47_0_0RCTBridgeModule>

@property (nonatomic, readonly) CGFloat multiplier;

/// map from UIKit categories to multipliers
@property (nonatomic, copy) NSDictionary<NSString *, NSNumber *> *multipliers;

@property (nonatomic, assign) BOOL isBoldTextEnabled;
@property (nonatomic, assign) BOOL isGrayscaleEnabled;
@property (nonatomic, assign) BOOL isInvertColorsEnabled;
@property (nonatomic, assign) BOOL isReduceMotionEnabled;
@property (nonatomic, assign) BOOL prefersCrossFadeTransitions;
@property (nonatomic, assign) BOOL isReduceTransparencyEnabled;
@property (nonatomic, assign) BOOL isVoiceOverEnabled;

@end

@interface ABI47_0_0RCTBridge (ABI47_0_0RCTAccessibilityManager)

@property (nonatomic, readonly) ABI47_0_0RCTAccessibilityManager *accessibilityManager;

@end
