// Copyright 2015-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>
#import "EXScopedFileSystemModule.h"
#import <EXFileSystem/EXFileSystem.h>

NS_ASSUME_NONNULL_BEGIN

// The purpose of this class is to properly move data from old scoped path to unscoped one.
// We need this class in case somebody wants to update standalone app.
// This class can be removed when sdk 32 is phased out.

@interface EXUnscopingDataMigrator : NSObject

+ (BOOL)firstStartAfterUpdate:(NSString *)experienceId;

+ (void)moveOldFiles:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END
