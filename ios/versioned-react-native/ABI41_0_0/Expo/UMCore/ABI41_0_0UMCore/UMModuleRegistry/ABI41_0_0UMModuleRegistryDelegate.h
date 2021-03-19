// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>

@protocol ABI41_0_0UMModuleRegistryDelegate <NSObject>

- (id<ABI41_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI41_0_0UMInternalModule>> *)internalModules;

@end
