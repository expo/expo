// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI31_0_0EXFileSystem/ABI31_0_0EXFileSystem.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXInternalModule.h>
#import <ABI31_0_0EXFileSystemInterface/ABI31_0_0EXFileSystemManagerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI31_0_0EXFileSystemManagerService : NSObject <ABI31_0_0EXInternalModule, ABI31_0_0EXFileSystemManager>

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

