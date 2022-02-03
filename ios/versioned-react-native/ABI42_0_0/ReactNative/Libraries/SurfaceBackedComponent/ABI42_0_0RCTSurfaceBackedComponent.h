/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <ComponentKit/CKCompositeComponent.h>
#import <ABI42_0_0RCTSurfaceHostingComponent/ABI42_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI42_0_0RCTBridge;

/**
 * ComponentKit component represents a ABI42_0_0React Native Surface created
 * (and stored in the state) with given `bridge`, `moduleName`,
 * and `properties`.
 */
@interface ABI42_0_0RCTSurfaceBackedComponent : CKCompositeComponent

+ (instancetype)newWithBridge:(ABI42_0_0RCTBridge *)bridge
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(ABI42_0_0RCTSurfaceHostingComponentOptions)options;

@end
