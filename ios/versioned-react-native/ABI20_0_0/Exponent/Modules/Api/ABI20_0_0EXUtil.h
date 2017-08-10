// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI20_0_0EXScopedBridgeModule.h"

@protocol ABI20_0_0EXUtilScopedModuleDelegate

- (void)utilModuleDidSelectReload:(id)scopedUtilModule;

@end

@interface ABI20_0_0EXUtil : ABI20_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;

@end
