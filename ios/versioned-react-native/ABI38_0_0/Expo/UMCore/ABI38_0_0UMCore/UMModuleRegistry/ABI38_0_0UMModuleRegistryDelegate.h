// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI38_0_0UMCore/ABI38_0_0UMInternalModule.h>

@protocol ABI38_0_0UMModuleRegistryDelegate <NSObject>

- (id<ABI38_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI38_0_0UMInternalModule>> *)internalModules;

@end
