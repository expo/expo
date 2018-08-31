// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI30_0_0EXCore/ABI30_0_0EXInternalModule.h>

@protocol ABI30_0_0EXModuleRegistryDelegate <NSObject>

- (id<ABI30_0_0EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<ABI30_0_0EXInternalModule>> *)internalModules;

@end
