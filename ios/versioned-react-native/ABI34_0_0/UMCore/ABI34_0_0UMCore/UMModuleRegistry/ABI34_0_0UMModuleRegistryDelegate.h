// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI34_0_0UMCore/ABI34_0_0UMInternalModule.h>

@protocol ABI34_0_0UMModuleRegistryDelegate <NSObject>

- (id<ABI34_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI34_0_0UMInternalModule>> *)internalModules;

@end
