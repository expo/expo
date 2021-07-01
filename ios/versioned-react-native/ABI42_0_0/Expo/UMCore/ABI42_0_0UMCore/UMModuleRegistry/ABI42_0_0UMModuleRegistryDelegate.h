// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI42_0_0UMCore/ABI42_0_0UMInternalModule.h>

@protocol ABI42_0_0UMModuleRegistryDelegate <NSObject>

- (id<ABI42_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI42_0_0UMInternalModule>> *)internalModules;

@end
