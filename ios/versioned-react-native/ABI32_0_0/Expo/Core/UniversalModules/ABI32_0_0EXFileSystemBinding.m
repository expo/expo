// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI32_0_0EXFileSystemBinding.h"
#import <ABI32_0_0EXConstantsInterface/ABI32_0_0EXConstantsInterface.h>

@interface ABI32_0_0EXFileSystemBinding ()

@property (nonatomic, weak) id<ABI32_0_0EXConstantsInterface> constantsModule;

@end

@implementation ABI32_0_0EXFileSystemBinding

- (void)setModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry
{
  _constantsModule = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI32_0_0EXConstantsInterface)];
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
