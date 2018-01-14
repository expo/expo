/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI25_0_0/ABI25_0_0RCTBridgeModule.h>

@interface ABI25_0_0RCTSettingsManager : NSObject <ABI25_0_0RCTBridgeModule>

- (instancetype)initWithUserDefaults:(NSUserDefaults *)defaults NS_DESIGNATED_INITIALIZER;

@end
