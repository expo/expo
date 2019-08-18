// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXFileSystem/ABI32_0_0EXFileSystem.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXInternalModule.h>
#import <ABI32_0_0EXFileSystemInterface/ABI32_0_0EXFileSystemManagerInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI32_0_0EXFileSystemManagerService : NSObject <ABI32_0_0EXInternalModule, ABI32_0_0EXFileSystemManager>

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

NS_ASSUME_NONNULL_END

