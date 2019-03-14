// Copyright © 2018 650 Industries. All rights reserved.

#import "EXFileSystemBinding.h"
#import <EXConstantsInterface/EXConstantsInterface.h>

@interface EXFileSystemBinding ()

@property (nonatomic, weak) id<EXConstantsInterface> constantsModule;

@end

@implementation EXFileSystemBinding

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _constantsModule = [moduleRegistry getModuleImplementingProtocol:@protocol(EXConstantsInterface)];
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
