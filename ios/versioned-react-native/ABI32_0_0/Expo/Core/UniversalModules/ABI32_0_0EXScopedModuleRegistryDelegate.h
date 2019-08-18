// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistry.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistryDelegate.h>

@interface ABI32_0_0EXScopedModuleRegistryDelegate : NSObject <ABI32_0_0EXModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<ABI32_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI32_0_0EXInternalModule>> *)internalModules;

@end
