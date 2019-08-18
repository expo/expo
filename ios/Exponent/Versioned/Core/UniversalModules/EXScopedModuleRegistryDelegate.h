// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMModuleRegistry.h>
#import <UMCore/UMModuleRegistryDelegate.h>

@interface EXScopedModuleRegistryDelegate : NSObject <UMModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<UMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<UMInternalModule>> *)internalModules;

@end
