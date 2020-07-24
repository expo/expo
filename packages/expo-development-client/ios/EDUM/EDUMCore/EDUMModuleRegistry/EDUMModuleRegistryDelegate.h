// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <EDUMInternalModule.h>

@protocol EDUMModuleRegistryDelegate <NSObject>

- (id<EDUMInternalModule>)pickInternalModuleImplementingInterface:(Protocol *)interface fromAmongModules:(NSArray<id<EDUMInternalModule>> *)internalModules;

@end
