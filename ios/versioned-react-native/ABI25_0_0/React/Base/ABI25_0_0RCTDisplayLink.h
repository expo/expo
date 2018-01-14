/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@protocol ABI25_0_0RCTBridgeModule;
@class ABI25_0_0RCTModuleData;

@interface ABI25_0_0RCTDisplayLink : NSObject

- (instancetype)init;
- (void)invalidate;
- (void)registerModuleForFrameUpdates:(id<ABI25_0_0RCTBridgeModule>)module
                       withModuleData:(ABI25_0_0RCTModuleData *)moduleData;
- (void)addToRunLoop:(NSRunLoop *)runLoop;

@end
