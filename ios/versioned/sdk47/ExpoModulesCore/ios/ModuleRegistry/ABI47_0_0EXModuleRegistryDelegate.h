// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXInternalModule.h>

@protocol ABI47_0_0EXModuleRegistryDelegate <NSObject>

- (id<ABI47_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI47_0_0EXInternalModule>> *)internalModules;

@end
