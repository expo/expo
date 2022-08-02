/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ComponentKit/CKComponent.h>
#import <ComponentKit/CKCompositeComponent.h>
#import <ABI46_0_0RCTSurfaceHostingComponent/ABI46_0_0RCTSurfaceHostingComponentOptions.h>
#import <ABI46_0_0React/ABI46_0_0RCTSurfacePresenter.h>

@class ABI46_0_0RCTBridge;

/**
 * ComponentKit component represents a ABI46_0_0React Native Surface created
 * (and stored in the state) with given `bridge`, `moduleName`,
 * and `properties`.
 */
@interface ABI46_0_0RCTSurfaceBackedComponent : CKCompositeComponent

+ (instancetype)newWithBridge:(ABI46_0_0RCTBridge *)bridge
             surfacePresenter:(ABI46_0_0RCTSurfacePresenter *)surfacePresenter
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(ABI46_0_0RCTSurfaceHostingComponentOptions)options;

@end
