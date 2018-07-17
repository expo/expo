// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXInternalModule.h>
#import <ABI29_0_0EXFileSystemInterface/ABI29_0_0EXFileSystemManagerInterface.h>

@protocol ABI29_0_0EXFileSystemScopedModuleDelegate

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

@interface ABI29_0_0EXFileSystemBinding : NSObject <ABI29_0_0EXInternalModule, ABI29_0_0EXFileSystemManager>

- (instancetype)initWithScopedModuleDelegate:(id<ABI29_0_0EXFileSystemScopedModuleDelegate>)kernelService;
- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end
