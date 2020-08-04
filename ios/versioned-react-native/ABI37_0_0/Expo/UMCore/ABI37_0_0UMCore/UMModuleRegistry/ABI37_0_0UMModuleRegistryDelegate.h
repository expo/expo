// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI37_0_0UMCore/ABI37_0_0UMInternalModule.h>

@protocol ABI37_0_0UMModuleRegistryDelegate <NSObject>

- (id<ABI37_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI37_0_0UMInternalModule>> *)internalModules;

@end
