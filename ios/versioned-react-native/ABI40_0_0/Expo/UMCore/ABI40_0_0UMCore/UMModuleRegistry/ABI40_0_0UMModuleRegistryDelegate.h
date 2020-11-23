// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>

@protocol ABI40_0_0UMModuleRegistryDelegate <NSObject>

- (id<ABI40_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI40_0_0UMInternalModule>> *)internalModules;

@end
