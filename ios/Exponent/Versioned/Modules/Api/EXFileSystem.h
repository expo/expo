// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXScopedBridgeModule.h"
#import "EXScopedModuleRegistry.h"

@interface EXFileSystem : EXScopedBridgeModule

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
- (NSString *)scopedPathWithPath:(NSString *)path withOptions:(NSDictionary *)options;

@end

EX_DECLARE_SCOPED_MODULE(EXFileSystem, fileSystem)
