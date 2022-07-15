// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistry.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryDelegate.h>

@interface ABI46_0_0EXScopedModuleRegistryDelegate : NSObject <ABI46_0_0EXModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<ABI46_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI46_0_0EXInternalModule>> *)internalModules;

@end
