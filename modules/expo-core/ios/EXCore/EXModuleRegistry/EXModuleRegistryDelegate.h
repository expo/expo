// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <EXCore/EXInternalModule.h>

@protocol EXModuleRegistryDelegate <NSObject>

- (id<EXInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<EXInternalModule>> *)internalModules;

@end
