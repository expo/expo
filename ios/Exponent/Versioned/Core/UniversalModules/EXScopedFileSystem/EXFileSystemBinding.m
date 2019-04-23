// Copyright © 2018 650 Industries. All rights reserved.

#import "EXFileSystemBinding.h"
#import <UMConstantsInterface/UMConstantsInterface.h>

@interface EXFileSystemBinding ()

@property (nonatomic, weak) id<UMConstantsInterface> constantsModule;

@end

@implementation EXFileSystemBinding

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _constantsModule = [moduleRegistry getModuleImplementingProtocol:@protocol(UMConstantsInterface)];
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
