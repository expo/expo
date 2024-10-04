// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXInternalModule.h>

@protocol ABI43_0_0EXModuleRegistryDelegate <NSObject>

- (id<ABI43_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI43_0_0EXInternalModule>> *)internalModules;

@end
