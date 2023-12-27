// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXInternalModule.h>

@protocol ABI44_0_0EXModuleRegistryDelegate <NSObject>

- (id<ABI44_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI44_0_0EXInternalModule>> *)internalModules;

@end
