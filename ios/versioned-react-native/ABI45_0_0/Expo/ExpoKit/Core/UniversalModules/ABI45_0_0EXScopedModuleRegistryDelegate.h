// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistry.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryDelegate.h>

@interface ABI45_0_0EXScopedModuleRegistryDelegate : NSObject <ABI45_0_0EXModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<ABI45_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI45_0_0EXInternalModule>> *)internalModules;

@end
