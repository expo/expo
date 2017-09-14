// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXScopedEventEmitter.h"
#import "ABI21_0_0EXScopedModuleRegistry.h"

@interface ABI21_0_0EXFileSystem : ABI21_0_0EXScopedEventEmitter

@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

+ (BOOL)ensureDirExistsWithPath:(NSString *)path;
+ (NSString *)documentDirectoryForExperienceId:(NSString *)experienceId;
+ (NSString *)cachesDirectoryForExperienceId:(NSString *)experienceId;

@end

ABI21_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI21_0_0EXFileSystem, fileSystem)
