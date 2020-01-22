// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"
#import "EXBuildConstants.h"
#import "EXKernelUtil.h"
#import "ExpoKit.h"
#import "EXEnvironment.h"

#import <Crashlytics/Crashlytics.h>
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
  _isDetached = NO;
  _standaloneManifestUrl = nil;
  _urlScheme = nil;
  _areRemoteUpdatesEnabled = YES;
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
  
  BOOL isDetached = NO;
#ifdef EX_DETACHED
  isDetached = YES;
#endif
  
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
              isDetached:isDetached
      isDebugXCodeScheme:isDebugXCodeScheme
            isUserDetach:isUserDetach];
}

- (void)_loadShellConfig:(NSDictionary *)shellConfig
           withInfoPlist:(NSDictionary *)infoPlist
       withExpoKitDevUrl:(NSString *)expoKitDevelopmentUrl
    withEmbeddedManifest:(NSDictionary *)embeddedManifest
              isDetached:(BOOL)isDetached
      isDebugXCodeScheme:(BOOL)isDebugScheme
            isUserDetach:(BOOL)isUserDetach
{
  [self _reset];
  NSMutableArray *allManifestUrls = [NSMutableArray array];
  _isDetached = isDetached;
  _isDebugXCodeScheme = isDebugScheme;

  if (shellConfig) {
    _testEnvironment = [EXTest testEnvironmentFromString:shellConfig[@"testEnvironment"]];

    if (_isDetached) {
      // configure published shell url
      [self _loadProductionUrlFromConfig:shellConfig];
      if (_standaloneManifestUrl) {
        [allManifestUrls addObject:_standaloneManifestUrl];
      }
      if (isDetached && isDebugScheme) {
        // local detach development: point shell manifest url at local development url
        [self _loadDetachedDevelopmentUrl:expoKitDevelopmentUrl];
        if (_standaloneManifestUrl) {
          [allManifestUrls addObject:_standaloneManifestUrl];
        }
      }
      // load standalone url scheme
      [self _loadUrlSchemeFromInfoPlist:infoPlist];
      if (!_standaloneManifestUrl) {
        @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                       reason:@"This app is configured to be a standalone app, but does not specify a standalone manifest url."
                                     userInfo:nil];
      }
      
      // load bundleUrl from embedded manifest
      [self _loadEmbeddedBundleUrlWithManifest:embeddedManifest];

      // load everything else from EXShell
      [self _loadMiscPropertiesWithConfig:shellConfig andInfoPlist:infoPlist];

      [self _setAnalyticsPropertiesWithStandaloneManifestUrl:_standaloneManifestUrl isUserDetached:isUserDetach];
    }
  }
  _allManifestUrls = allManifestUrls;
}

- (void)_loadProductionUrlFromConfig:(NSDictionary *)shellConfig
{
  _standaloneManifestUrl = shellConfig[@"manifestUrl"];
  if ([ExpoKit sharedInstance].publishedManifestUrlOverride) {
    _standaloneManifestUrl = [ExpoKit sharedInstance].publishedManifestUrlOverride;
  }
}

- (void)_loadDetachedDevelopmentUrl:(NSString *)expoKitDevelopmentUrl
{
  if (expoKitDevelopmentUrl) {
    _standaloneManifestUrl = expoKitDevelopmentUrl;
  } else {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"You are running a detached app from Xcode, but it hasn't been configured for local development yet. "
                                           "You must run a packager for this Expo project before running it from XCode."
                                 userInfo:nil];
  }
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

- (void)_loadMiscPropertiesWithConfig:(NSDictionary *)shellConfig andInfoPlist:(NSDictionary *)infoPlist
{
  _isManifestVerificationBypassed = [shellConfig[@"isManifestVerificationBypassed"] boolValue];
  _areRemoteUpdatesEnabled = (shellConfig[@"areRemoteUpdatesEnabled"] == nil)
    ? YES
    : [shellConfig[@"areRemoteUpdatesEnabled"] boolValue];
  if (infoPlist[@"ExpoReleaseChannel"]) {
    _releaseChannel = infoPlist[@"ExpoReleaseChannel"];
  } else {
    _releaseChannel = (shellConfig[@"releaseChannel"] == nil) ? @"default" : shellConfig[@"releaseChannel"];
  }
  // other shell config goes here
}

- (void)_loadEmbeddedBundleUrlWithManifest:(NSDictionary *)manifest
{
  id bundleUrl = manifest[@"bundleUrl"];
  if (bundleUrl && [bundleUrl isKindOfClass:[NSString class]]) {
    _embeddedBundleUrl = (NSString *)bundleUrl;
  }
}

- (void)_setAnalyticsPropertiesWithStandaloneManifestUrl:(NSString *)shellManifestUrl
                                     isUserDetached:(BOOL)isUserDetached
{
  if (_testEnvironment == EXTestEnvironmentNone) {
    [[EXAnalytics sharedInstance] setUserProperties:@{ @"INITIAL_URL": shellManifestUrl }];
    [CrashlyticsKit setObjectValue:_standaloneManifestUrl forKey:@"initial_url"];
    if (isUserDetached) {
      [[EXAnalytics sharedInstance] setUserProperties:@{ @"IS_DETACHED": @YES }];
    }
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
