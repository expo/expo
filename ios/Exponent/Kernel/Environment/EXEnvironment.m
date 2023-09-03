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
  _urlScheme = nil;
  _allManifestUrls = @[];
  _isDebugXCodeScheme = NO;
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
  
  BOOL isDetached = NO;
  
  BOOL isDebugXCodeScheme = NO;
#if DEBUG
  isDebugXCodeScheme = YES;
#endif
  
  BOOL isUserDetach = NO;
  if (isDetached) {
#ifndef EX_DETACHED_SERVICE
  isUserDetach = YES;
#endif
  }
  
  [self _loadShellConfig:shellConfig
           withInfoPlist:infoPlist
       withExpoKitDevUrl:expoKitDevelopmentUrl
    withEmbeddedManifest:embeddedManifest
      isDebugXCodeScheme:isDebugXCodeScheme
            isUserDetach:isUserDetach];
}

- (void)_loadShellConfig:(NSDictionary *)shellConfig
           withInfoPlist:(NSDictionary *)infoPlist
       withExpoKitDevUrl:(NSString *)expoKitDevelopmentUrl
    withEmbeddedManifest:(NSDictionary *)embeddedManifest
      isDebugXCodeScheme:(BOOL)isDebugScheme
            isUserDetach:(BOOL)isUserDetach
{
  [self _reset];
  NSMutableArray *allManifestUrls = [NSMutableArray array];
  _isDebugXCodeScheme = isDebugScheme;

  if (shellConfig) {
    _testEnvironment = [EXTest testEnvironmentFromString:shellConfig[@"testEnvironment"]];
  }
  _allManifestUrls = allManifestUrls;
}

- (void)_loadUrlSchemeFromInfoPlist:(NSDictionary *)infoPlist
{
  if (infoPlist[@"CFBundleURLTypes"]) {
    // if the shell app has a custom url scheme, read that.
    // this was configured when the shell app was built.
    NSArray *urlTypes = infoPlist[@"CFBundleURLTypes"];
    if (urlTypes && urlTypes.count) {
      NSDictionary *urlType = urlTypes[0];
      NSArray *urlSchemes = urlType[@"CFBundleURLSchemes"];
      if (urlSchemes) {
        for (NSString *urlScheme in urlSchemes) {
          if ([self _isValidStandaloneUrlScheme:urlScheme forDevelopment:NO]) {
            _urlScheme = urlScheme;
            break;
          }
        }
      }
    }
  }
}

- (void)_loadEmbeddedBundleUrlWithManifest:(NSDictionary *)manifest
{
  id bundleUrl = manifest[@"bundleUrl"];
  if (bundleUrl && [bundleUrl isKindOfClass:[NSString class]]) {
    _embeddedBundleUrl = (NSString *)bundleUrl;
  }
}

/**
 *  Is this a valid url scheme for a standalone app?
 */
- (BOOL)_isValidStandaloneUrlScheme:(NSString *)urlScheme forDevelopment:(BOOL)isForDevelopment
{
  // don't allow shell apps to intercept exp links
  if (urlScheme && urlScheme.length) {
    if (isForDevelopment) {
      return YES;
    } else {
      // prod shell apps must have some non-exp/exps url scheme
      return (![urlScheme isEqualToString:@"exp"] && ![urlScheme isEqualToString:@"exps"]);
    }
  }
  return NO;
}

@end
