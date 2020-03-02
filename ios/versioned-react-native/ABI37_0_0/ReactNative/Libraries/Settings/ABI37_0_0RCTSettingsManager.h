/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>

@interface ABI37_0_0RCTSettingsManager : NSObject <ABI37_0_0RCTBridgeModule>

- (instancetype)initWithUserDefaults:(NSUserDefaults *)defaults NS_DESIGNATED_INITIALIZER;

@end
