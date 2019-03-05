// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXFileSystem/EXFileSystem.h>
#import <UMCore/UMInternalModule.h>
#import <UMFileSystemInterface/UMFileSystemManagerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXFileSystemManagerService : NSObject <UMInternalModule, UMFileSystemManager>

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

