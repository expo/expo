// Copyright 2015-present 650 Industries. All rights reserved.

//#import "EXShellManager.h"
#import <EXFileSystem/EXFileSystemManager.h>
#import <EXCore/EXDefines.h>

// Returns if the experience id is the main shell experience.
BOOL EXIsShellExperience(NSString *experienceId) {
  return false;
//  return [[EXShellManager sharedInstance].shellManifestUrl containsString:experienceId];
}

NSString * const kEXShellManifestResourceName = @"shell-app-manifest";

@implementation EXFileSystemManager

- (NSString *)bundleDirectoryForExperienceId:(NSString *)experienceId
{
  if (!EXIsShellExperience(experienceId)) {
    return nil;
  }
  return [NSBundle mainBundle].bundlePath;
}

- (NSArray<NSString *> *)bundledAssetsForExperienceId:(NSString *)experienceId
{
  if (!EXIsShellExperience(experienceId)) {
    return nil;
  }
  
  static NSArray<NSString *> *bundledAssets = nil;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    NSString *manifestBundlePath = [[NSBundle mainBundle] pathForResource:kEXShellManifestResourceName ofType:@"json"];
    NSData *data = [NSData dataWithContentsOfFile:manifestBundlePath];
    if (data.length == 0) {
      return;
    }
    __block NSError *error;
    id manifest = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
    if (error) {
      EXLogError(@"Error parsing bundled manifest: %@", error);
      return;
    }
    bundledAssets = manifest[@"bundledAssets"];
  });
  return bundledAssets;
}

@end

