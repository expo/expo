// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXScopedBridgeModule.h"

@protocol ABI21_0_0EXUtilScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedUpdatesModule;

@end

@interface ABI21_0_0EXUtil : ABI21_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;

@end
