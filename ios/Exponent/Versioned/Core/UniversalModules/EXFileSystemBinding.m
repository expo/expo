// Copyright © 2018 650 Industries. All rights reserved.

#import "EXFileSystemBinding.h"

@interface EXFileSystemBinding ()

@property (nonatomic, weak) id<EXFileSystemScopedModuleDelegate> kernelService;

@end

@implementation EXFileSystemBinding

- (instancetype)initWithScopedModuleDelegate:(id<EXFileSystemScopedModuleDelegate>)kernelService
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
  return @[@protocol(EXFileSystemManager)];
}

@end
