// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBuildConstants.h"

@implementation EXBuildConstants

+ (instancetype)sharedInstance
{
  static EXBuildConstants *theBuildConstants;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theBuildConstants) {
      theBuildConstants = [[EXBuildConstants alloc] init];
    }
  });
  return theBuildConstants;
}

- (instancetype)init
{
  if (self = [super init]) {
    [self _loadConfig];
  }
  return self;
}

#pragma mark - internal

- (void)_reset
{
  _expoRuntimeVersion = @"";
}

- (void)_loadConfig
{
  [self _reset];

  NSString *plistPath = [[NSBundle mainBundle] pathForResource:@"EXBuildConstants" ofType:@"plist"];
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
  _apiServerEndpoint = [NSURL URLWithString:config[@"API_SERVER_ENDPOINT"]];
  _temporarySdkVersion = config[@"TEMPORARY_SDK_VERSION"];
  if (config[@"EXPO_RUNTIME_VERSION"]) {
    _expoRuntimeVersion = config[@"EXPO_RUNTIME_VERSION"];
  }
  if (config[@"DEFAULT_API_KEYS"]) {
    _defaultApiKeys = config[@"DEFAULT_API_KEYS"];
  }
  _expoKitDevelopmentUrl = config[@"developmentUrl"]; // TODO: make legacy name consistent with the rest of this file
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
