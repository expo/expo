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
  _kernelDevManifestSource = [[self class] _kernelManifestSourceFromString:config[@"DEV_KERNEL_SOURCE"]];
  if (_kernelDevManifestSource == kEXKernelDevManifestSourceLocal) {
    // local kernel. use manifest from local server.
    _kernelManifestJsonString = config[@"BUILD_MACHINE_KERNEL_MANIFEST"];
  } else if (_kernelDevManifestSource == kEXKernelDevManifestSourcePublished) {
    // dev published kernel. use published manifest.
    _kernelManifestJsonString = config[@"DEV_PUBLISHED_KERNEL_MANIFEST"];
  }
  _temporarySdkVersion = config[@"TEMPORARY_SDK_VERSION"];
}

+ (EXKernelDevManifestSource)_kernelManifestSourceFromString:(NSString *)sourceString
{
  if ([sourceString isEqualToString:@"LOCAL"]) {
    return kEXKernelDevManifestSourceLocal;
  } else if ([sourceString isEqualToString:@"PUBLISHED"]) {
    return kEXKernelDevManifestSourcePublished;
  }
  return kEXKernelDevManifestSourceNone;
}

@end
