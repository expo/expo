// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXScopedBridgeModule.h"

@protocol ABI22_0_0EXUtilScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedUpdatesModule;

@end

@interface ABI22_0_0EXUtil : ABI22_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;

@end
