/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <ComponentKit/CKCompositeComponent.h>
#import <ABI45_0_0RCTSurfaceHostingComponent/ABI45_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI45_0_0RCTBridge;

/**
 * ComponentKit component represents a ABI45_0_0React Native Surface created
 * (and stored in the state) with given `bridge`, `moduleName`,
 * and `properties`.
 */
@interface ABI45_0_0RCTSurfaceBackedComponent : CKCompositeComponent

+ (instancetype)newWithBridge:(ABI45_0_0RCTBridge *)bridge
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(ABI45_0_0RCTSurfaceHostingComponentOptions)options;

@end
