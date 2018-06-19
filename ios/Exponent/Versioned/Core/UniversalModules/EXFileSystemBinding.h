// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXInternalModule.h>
#import <EXFileSystemInterface/EXFileSystemManagerInterface.h>

@protocol EXFileSystemScopedModuleDelegate

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end

@interface EXFileSystemBinding : NSObject <EXInternalModule, EXFileSystemManager>

- (instancetype)initWithScopedModuleDelegate:(id<EXFileSystemScopedModuleDelegate>)kernelService;
- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId;
- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId;

@end
