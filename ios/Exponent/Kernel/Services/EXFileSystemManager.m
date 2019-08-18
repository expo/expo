// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFileSystemManager.h"

// Nothing should ever call these functions in standalone scenario.
// This class is used only in SDKs < 29. In new SDKs, consumers
// don't rely on FS kernel service, but rather on universal modules.
// Older SDKs aren't built with new kernel, so this class is only used
// in Expo Client for old SDKs. This is why the implementation just returns
// empty values — in Expo Client these values are always nil.

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
