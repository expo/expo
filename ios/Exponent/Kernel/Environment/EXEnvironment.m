// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBuildConstants.h"
#import "EXKernelUtil.h"
#import "ExpoKit.h"
#import "EXEnvironment.h"

#import <React/RCTUtils.h>

NSString * const kEXEmbeddedBundleResourceName = @"shell-app";
NSString * const kEXEmbeddedManifestResourceName = @"shell-app-manifest";

@implementation EXEnvironment

+ (nonnull instancetype)sharedEnvironment
{
  static EXEnvironment *theManager;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theManager) {
      theManager = [[EXEnvironment alloc] init];
    }
  });
  return theManager;
}

- (id)init
{
  if (self = [super init]) {
    [self _loadDefaultConfig];
  }
  return self;
}

- (BOOL)isStandaloneUrlScheme:(NSString *)scheme
{
  return (_urlScheme && [scheme isEqualToString:_urlScheme]);
}

- (BOOL)hasUrlScheme
{
  return (_urlScheme != nil);
}

#pragma mark - internal

- (void)_reset
{
  _standaloneManifestUrl = nil;
  _urlScheme = nil;
  _areRemoteUpdatesEnabled = YES;
  _updatesCheckAutomatically = YES;
  _updatesFallbackToCacheTimeout = @(0);
  _allManifestUrls = @[];
  _isDebugXCodeScheme = NO;
  _releaseChannel = @"default";
}

- (void)_loadDefaultConfig
{
  // use bundled EXShell.plist
  NSString *configPath = [[NSBundle mainBundle] pathForResource:@"EXShell" ofType:@"plist"];
  NSDictionary *shellConfig = (configPath) ? [NSDictionary dictionaryWithContentsOfFile:configPath] : [NSDictionary dictionary];
  
  // use ExpoKit dev url from EXBuildConstants
  NSString *expoKitDevelopmentUrl = [EXBuildConstants sharedInstance].expoKitDevelopmentUrl;
  
  // use bundled info.plist
  NSDictionary *infoPlist = [[NSBundle mainBundle] infoDictionary];

  // use bundled shell app manifest
  NSDictionary *embeddedManifest = @{};
  NSString *path = [[NSBundle mainBundle] pathForResource:kEXEmbeddedManifestResourceName ofType:@"json"];
  NSData *data = [NSData dataWithContentsOfFile:path];
  if (data) {
    NSError *jsonError;
    id manifest = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&jsonError];
    if (!jsonError && [manifest isKindOfClass:[NSDictionary class]]) {
      embeddedManifest = (NSDictionary *)manifest;
    }
  }
  
  BOOL isDebugXCodeScheme = NO;
#if DEBUG
  isDebugXCodeScheme = YES;
#endif
  
  [self _loadShellConfig:shellConfig
           withInfoPlist:infoPlist
       withExpoKitDevUrl:expoKitDevelopmentUrl
    withEmbeddedManifest:embeddedManifest
      isDebugXCodeScheme:isDebugXCodeScheme];
}

- (void)_loadShellConfig:(NSDictionary *)shellConfig
           withInfoPlist:(NSDictionary *)infoPlist
       withExpoKitDevUrl:(NSString *)expoKitDevelopmentUrl
    withEmbeddedManifest:(NSDictionary *)embeddedManifest
      isDebugXCodeScheme:(BOOL)isDebugScheme
{
  [self _reset];
  NSMutableArray *allManifestUrls = [NSMutableArray array];
  _isDebugXCodeScheme = isDebugScheme;

  if (shellConfig) {
    _testEnvironment = [EXTest testEnvironmentFromString:shellConfig[@"testEnvironment"]];
  }
  _allManifestUrls = allManifestUrls;
}

@end
