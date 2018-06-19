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
  return nil;
}

- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId
{
  return nil;
}

@end

