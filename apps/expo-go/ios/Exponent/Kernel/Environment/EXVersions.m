// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBuildConstants.h"
#import "EXVersions.h"
#import "EXKernelUtil.h"

@import EXManifests;

@implementation EXVersions

+ (nonnull instancetype)sharedInstance
{
  static EXVersions *theVersions;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theVersions) {
      theVersions = [[EXVersions alloc] init];
    }
  });
  return theVersions;
}

- (instancetype)init
{
  if (self = [super init]) {
    _sdkVersion = [EXBuildConstants sharedInstance].sdkVersion;
  }
  return self;
}

- (NSString *)availableSdkVersionForManifest:(EXManifestsManifest * _Nullable)manifest
{
  if (manifest && manifest.expoGoSDKVersion) {
    if ([manifest.expoGoSDKVersion isEqualToString:_sdkVersion]) {
      return _sdkVersion;
    }
  }
  return @"";
}

- (BOOL)supportsVersion:(NSString *)sdkVersion
{
  return [_sdkVersion isEqualToString:sdkVersion];
}

@end
