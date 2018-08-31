// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryDelegate.h>

@interface ABI30_0_0EXScopedModuleRegistryDelegate : NSObject <ABI30_0_0EXModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<ABI30_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI30_0_0EXInternalModule>> *)internalModules;

@end
