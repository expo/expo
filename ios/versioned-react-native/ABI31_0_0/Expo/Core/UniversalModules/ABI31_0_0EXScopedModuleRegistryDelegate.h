// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistry.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryDelegate.h>

@interface ABI31_0_0EXScopedModuleRegistryDelegate : NSObject <ABI31_0_0EXModuleRegistryDelegate>

- (instancetype)initWithParams:(NSDictionary *)params;

- (id<ABI31_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI31_0_0EXInternalModule>> *)internalModules;

@end
