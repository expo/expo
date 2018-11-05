// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI29_0_0EXFileSystem/ABI29_0_0EXFileSystem.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXInternalModule.h>
#import <ABI29_0_0EXFileSystemInterface/ABI29_0_0EXFileSystemManagerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI29_0_0EXFileSystemManagerService : NSObject <ABI29_0_0EXInternalModule, ABI29_0_0EXFileSystemManager>

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

