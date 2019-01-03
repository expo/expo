// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI32_0_0EXCore/ABI32_0_0EXInternalModule.h>

@protocol ABI32_0_0EXModuleRegistryDelegate <NSObject>

- (id<ABI32_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI32_0_0EXInternalModule>> *)internalModules;

@end
