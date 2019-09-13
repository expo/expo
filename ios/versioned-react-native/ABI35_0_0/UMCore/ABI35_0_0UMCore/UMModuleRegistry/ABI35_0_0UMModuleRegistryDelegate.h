// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI35_0_0UMCore/ABI35_0_0UMInternalModule.h>

@protocol ABI35_0_0UMModuleRegistryDelegate <NSObject>

- (id<ABI35_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI35_0_0UMInternalModule>> *)internalModules;

@end
