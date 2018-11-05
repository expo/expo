// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryDelegate.h>

@interface EXScopedModuleRegistryDelegate : NSObject <EXModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<EXInternalModule>> *)internalModules;

@end
