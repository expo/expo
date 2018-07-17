// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistry.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistryDelegate.h>

@interface ABI29_0_0EXScopedModuleRegistryDelegate : NSObject <ABI29_0_0EXModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<ABI29_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI29_0_0EXInternalModule>> *)internalModules;

@end
