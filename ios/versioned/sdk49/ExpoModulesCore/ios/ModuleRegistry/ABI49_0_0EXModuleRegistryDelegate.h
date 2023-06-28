// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXInternalModule.h>

@protocol ABI49_0_0EXModuleRegistryDelegate <NSObject>

- (id<ABI49_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI49_0_0EXInternalModule>> *)internalModules;

@end
