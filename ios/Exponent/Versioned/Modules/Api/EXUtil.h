// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXScopedBridgeModule.h"

@protocol EXUtilScopedModuleDelegate

- (void)utilModuleDidSelectReload:(id)scopedUtilModule;

@end

@interface EXUtil : EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;

@end
