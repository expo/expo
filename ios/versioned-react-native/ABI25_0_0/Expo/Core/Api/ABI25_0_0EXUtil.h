// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXScopedBridgeModule.h"

@protocol ABI25_0_0EXUtilScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedUpdatesModule;

@end

@interface ABI25_0_0EXUtil : ABI25_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;
+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;

@end
