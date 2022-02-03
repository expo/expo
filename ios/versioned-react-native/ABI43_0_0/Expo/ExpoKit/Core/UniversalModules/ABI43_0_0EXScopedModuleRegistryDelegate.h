// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryDelegate.h>

@interface ABI43_0_0EXScopedModuleRegistryDelegate : NSObject <ABI43_0_0EXModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<ABI43_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI43_0_0EXInternalModule>> *)internalModules;

@end
