// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI30_0_0EXFileSystemBinding.h"
#import <ABI30_0_0EXConstantsInterface/ABI30_0_0EXConstantsInterface.h>

@interface ABI30_0_0EXFileSystemBinding ()

@property (nonatomic, weak) id<ABI30_0_0EXConstantsInterface> constantsModule;

@end

@implementation ABI30_0_0EXFileSystemBinding

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  _constantsModule = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXConstantsInterface)];
}

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId
{
  if ([_constantsModule.appOwnership isEqualToString:@"expo"]) {
    return nil;
  }

  return [super bundleDirectoryForExperienceId:experienceId];
}

- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId
{
  if ([_constantsModule.appOwnership isEqualToString:@"expo"]) {
    return nil;
  }

  return [super bundledAssetsForExperienceId:experienceId];
}

@end
