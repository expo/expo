/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <ComponentKit/CKCompositeComponent.h>
#import <ABI33_0_0RCTSurfaceHostingComponent/ABI33_0_0RCTSurfaceHostingComponentOptions.h>

@class ABI33_0_0RCTBridge;

/**
 * ComponentKit component represents a ReactABI33_0_0 Native Surface created
 * (and stored in the state) with given `bridge`, `moduleName`,
 * and `properties`.
 */
@interface ABI33_0_0RCTSurfaceBackedComponent : CKCompositeComponent

+ (instancetype)newWithBridge:(ABI33_0_0RCTBridge *)bridge
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(ABI33_0_0RCTSurfaceHostingComponentOptions)options;

@end
