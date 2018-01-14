/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ComponentKit/CKComponent.h>
#import <ComponentKit/CKCompositeComponent.h>
#import <ABI25_0_0RCTSurfaceHostingComponent/ABI25_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI25_0_0RCTBridge;

/**
 * ComponentKit component represents a ReactABI25_0_0 Native Surface created
 * (and stored in the state) with given `bridge`, `moduleName`,
 * and `properties`.
 */
@interface ABI25_0_0RCTSurfaceBackedComponent : CKCompositeComponent

+ (instancetype)newWithBridge:(ABI25_0_0RCTBridge *)bridge
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(ABI25_0_0RCTSurfaceHostingComponentOptions)options;

@end
