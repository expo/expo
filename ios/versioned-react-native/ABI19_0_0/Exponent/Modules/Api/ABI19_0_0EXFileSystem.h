// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXScopedBridgeModule.h"
#import "ABI19_0_0EXScopedModuleRegistry.h"

@interface ABI19_0_0EXFileSystem : ABI19_0_0EXScopedBridgeModule

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;

@end

ABI19_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI19_0_0EXFileSystem, fileSystem)
