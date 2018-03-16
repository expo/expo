// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXScopedBridgeModule.h"

@protocol ABI24_0_0EXUtilScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedUpdatesModule;

@end

@interface ABI24_0_0EXUtil : ABI24_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;

@end
