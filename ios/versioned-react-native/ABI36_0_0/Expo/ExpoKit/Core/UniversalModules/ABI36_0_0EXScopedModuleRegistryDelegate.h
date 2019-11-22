// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistry.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryDelegate.h>

@interface ABI36_0_0EXScopedModuleRegistryDelegate : NSObject <ABI36_0_0UMModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<ABI36_0_0UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI36_0_0UMInternalModule>> *)internalModules;

@end
