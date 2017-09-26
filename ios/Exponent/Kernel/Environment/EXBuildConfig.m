// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBuildConfig.h"

@implementation EXBuildConfig

+ (instancetype)sharedInstance
{
  static EXBuildConfig *theBuildConfig;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theBuildConfig) {
      theBuildConfig = [[EXBuildConfig alloc] init];
    }
  });
  return theBuildConfig;
}

- (instancetype)init
{
  if (self = [super init]) {
    [self _loadConfig];
  }
  return self;
}

#pragma mark - internal

- (void)_loadConfig
{
  NSString *plistPath = [[NSBundle mainBundle] pathForResource:@"EXBuildConfig" ofType:@"plist"];
  NSDictionary *config = (plistPath) ? [NSDictionary dictionaryWithContentsOfFile:plistPath] : [NSDictionary dictionary];
  _isDevKernel = [config[@"IS_DEV_KERNEL"] boolValue];
  _kernelManifestJsonString = config[@"BUILD_MACHINE_KERNEL_MANIFEST"];
  _temporarySdkVersion = config[@"TEMPORARY_SDK_VERSION"];
}

@end
