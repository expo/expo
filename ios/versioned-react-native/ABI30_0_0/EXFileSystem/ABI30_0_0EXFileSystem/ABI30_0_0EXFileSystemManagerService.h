// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI30_0_0EXFileSystem/ABI30_0_0EXFileSystem.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXInternalModule.h>
#import <ABI30_0_0EXFileSystemInterface/ABI30_0_0EXFileSystemManagerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI30_0_0EXFileSystemManagerService : NSObject <ABI30_0_0EXInternalModule, ABI30_0_0EXFileSystemManager>

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

