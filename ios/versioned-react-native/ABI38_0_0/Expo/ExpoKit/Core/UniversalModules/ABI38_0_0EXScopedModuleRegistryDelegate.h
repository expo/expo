// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistry.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryDelegate.h>

@interface ABI38_0_0EXScopedModuleRegistryDelegate : NSObject <ABI38_0_0UMModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<ABI38_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI38_0_0UMInternalModule>> *)internalModules;

@end
