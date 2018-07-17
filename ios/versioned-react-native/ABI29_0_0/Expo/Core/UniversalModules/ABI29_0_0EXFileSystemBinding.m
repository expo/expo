// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI29_0_0EXFileSystemBinding.h"

@interface ABI29_0_0EXFileSystemBinding ()

@property (nonatomic, weak) id<ABI29_0_0EXFileSystemScopedModuleDelegate> kernelService;

@end

@implementation ABI29_0_0EXFileSystemBinding

- (instancetype)initWithScopedModuleDelegate:(id<ABI29_0_0EXFileSystemScopedModuleDelegate>)kernelService
{
  if (self = [super init]) {
    _kernelService = kernelService;
  }
  return self;
}

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId
{
  return [_kernelService bundleDirectoryForExperienceId:experienceId];
}

- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId
{
  return [_kernelService bundledAssetsForExperienceId:experienceId];
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI29_0_0EXFileSystemManager)];
}

@end
