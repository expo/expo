/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <ComponentKit/CKCompositeComponent.h>
#import <ABI29_0_0RCTSurfaceHostingComponent/ABI29_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI29_0_0RCTBridge;

/**
 * ComponentKit component represents a ReactABI29_0_0 Native Surface created
 * (and stored in the state) with given `bridge`, `moduleName`,
 * and `properties`.
 */
@interface ABI29_0_0RCTSurfaceBackedComponent : CKCompositeComponent

+ (instancetype)newWithBridge:(ABI29_0_0RCTBridge *)bridge
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(ABI29_0_0RCTSurfaceHostingComponentOptions)options;

@end
