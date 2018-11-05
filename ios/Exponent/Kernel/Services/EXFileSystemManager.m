// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXEnvironment.h"
#import "EXFileSystemManager.h"

// Returns if the experience id is the standalone experience.
BOOL EXIsStandaloneExperience(NSString *experienceId) {
  return [[EXEnvironment sharedEnvironment].standaloneManifestUrl containsString:experienceId];
}

@implementation EXFileSystemManager

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId
{
  if (!EXIsStandaloneExperience(experienceId)) {
    return nil;
  }

  return [super bundleDirectoryForExperienceId:experienceId];
}

- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId
{
  if (!EXIsStandaloneExperience(experienceId)) {
    return nil;
  }
  
  return [super bundledAssetsForExperienceId:experienceId];
}

@end
