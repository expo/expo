// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXInternalModule.h>

@protocol ABI45_0_0EXModuleRegistryDelegate <NSObject>

- (id<ABI45_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI45_0_0EXInternalModule>> *)internalModules;

@end
