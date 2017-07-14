// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXScopedBridgeModule.h"

@protocol ABI19_0_0EXUtilScopedModuleDelegate

- (void)utilModuleDidSelectReload:(id)scopedUtilModule;

@end

@interface ABI19_0_0EXUtil : ABI19_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;

@end
