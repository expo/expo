// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXInternalModule.h>

@protocol ABI48_0_0EXModuleRegistryDelegate <NSObject>

- (id<ABI48_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI48_0_0EXInternalModule>> *)internalModules;

@end
