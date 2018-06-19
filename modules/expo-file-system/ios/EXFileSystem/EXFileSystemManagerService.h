// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXFileSystem/EXFileSystem.h>
#import <EXCore/EXInternalModule.h>
#import <EXFileSystemInterface/EXFileSystemManagerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXFileSystemManagerService : NSObject <EXInternalModule, EXFileSystemManager>

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

