// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI33_0_0UMCore/ABI33_0_0UMInternalModule.h>

@protocol ABI33_0_0UMModuleRegistryDelegate <NSObject>

- (id<ABI33_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI33_0_0UMInternalModule>> *)internalModules;

@end
