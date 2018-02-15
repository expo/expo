// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXScopedBridgeModule.h"

@protocol ABI26_0_0EXUtilScopedModuleDelegate

- (void)utilModuleDidSelectReload:(id)scopedUtilModule;

@end

@interface ABI26_0_0EXUtil : ABI26_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;
+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;

@end
