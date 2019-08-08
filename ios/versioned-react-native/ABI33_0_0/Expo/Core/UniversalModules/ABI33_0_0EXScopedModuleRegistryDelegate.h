// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistry.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryDelegate.h>

@interface ABI33_0_0EXScopedModuleRegistryDelegate : NSObject <ABI33_0_0UMModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<ABI33_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI33_0_0UMInternalModule>> *)internalModules;

@end
