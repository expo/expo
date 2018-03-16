// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXScopedBridgeModule.h"

@protocol ABI23_0_0EXUtilScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedUpdatesModule;

@end

@interface ABI23_0_0EXUtil : ABI23_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;

@end
