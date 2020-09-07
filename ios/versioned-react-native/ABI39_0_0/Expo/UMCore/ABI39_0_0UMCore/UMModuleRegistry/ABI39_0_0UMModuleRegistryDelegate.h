// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI39_0_0UMCore/ABI39_0_0UMInternalModule.h>

@protocol ABI39_0_0UMModuleRegistryDelegate <NSObject>

- (id<ABI39_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI39_0_0UMInternalModule>> *)internalModules;

@end
