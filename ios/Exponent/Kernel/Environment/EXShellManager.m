// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"
#import "EXBuildConstants.h"
#import "EXKernelUtil.h"
#import "ExpoKit.h"
#import "EXShellManager.h"

#import <Crashlytics/Crashlytics.h>
#import <React/RCTUtils.h>

NSString * const kEXShellBundleResourceName = @"shell-app";
NSString * const kEXShellManifestResourceName = @"shell-app-manifest";

@implementation EXShellManager

+ (nonnull instancetype)sharedInstance
{
  static EXShellManager *theManager;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theManager) {
      theManager = [[EXShellManager alloc] init];
    }
  });
  return theManager;
}

- (id)init
{
  if (self = [super init]) {
    [self _loadConfig];
  }
  return self;
}

- (BOOL)isShellUrlScheme:(NSString *)scheme
{
  return (_urlScheme && [scheme isEqualToString:_urlScheme]);
}

- (BOOL)hasUrlScheme
{
  return (_urlScheme != nil);
}

- (BOOL)isDetached
{
#ifdef EX_DETACHED
  return YES;
#else
  return NO;
#endif
}


#pragma mark internal

- (BOOL)_isLocalDetach
{
#if DEBUG
  return self.isDetached;
#else
  return NO;
#endif
}

- (void)_reset
{
  _isShell = NO;
  _shellManifestUrl = nil;
  _urlScheme = nil;
  _isRemoteJSEnabled = YES;
  _loadJSInBackgroundExperimental = NO;
  _allManifestUrls = @[];
}

- (void)_loadConfig
{
  [self _reset];
  
  // load EXShell.plist
  NSString *configPath = [[NSBundle mainBundle] pathForResource:@"EXShell" ofType:@"plist"];
  NSDictionary *shellConfig = (configPath) ? [NSDictionary dictionaryWithContentsOfFile:configPath] : [NSDictionary dictionary];
  
  // load EXBuildConstants
  NSString *expoKitDevelopmentUrl = [EXBuildConstants sharedInstance].expoKitDevelopmentUrl;

  NSMutableArray *allManifestUrls = [NSMutableArray array];

  if (shellConfig) {
    _isShell = [shellConfig[@"isShell"] boolValue];
    if (_isShell) {
      // configure published shell url
      [self _loadProductionUrlFromConfig:shellConfig];
      if (_shellManifestUrl) {
        [allManifestUrls addObject:_shellManifestUrl];
      }
      if (self._isLocalDetach) {
        // local detach development: point shell manifest url at local development url,
        // and use exp<udid> scheme.
        [self _loadDetachedDevelopmentUrlAndScheme:expoKitDevelopmentUrl fallbackToShellConfig:shellConfig];
        if (_shellManifestUrl) {
          [allManifestUrls addObject:_shellManifestUrl];
        }
      } else {
        // load standalone url scheme
        [self _loadProductionUrlScheme];
      }
      if (!_shellManifestUrl) {
        @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                       reason:@"This app is configured to be a standalone app, but does not specify a standalone experience url."
                                     userInfo:nil];
      }
      
      // load everything else from EXShell
      [self _loadMiscShellPropertiesWithConfig:shellConfig];

      [self _setAnalyticsProperties];
    }
  }
  _allManifestUrls = allManifestUrls;
}

- (void)_loadProductionUrlFromConfig:(NSDictionary *)shellConfig
{
  _shellManifestUrl = shellConfig[@"manifestUrl"];
  if ([ExpoKit sharedInstance].publishedManifestUrlOverride) {
    _shellManifestUrl = [ExpoKit sharedInstance].publishedManifestUrlOverride;
  }
}

- (void)_loadDetachedDevelopmentUrlAndScheme:(NSString *)expoKitDevelopmentUrl fallbackToShellConfig:(NSDictionary *)shellConfig
{
  NSString *developmentUrl = nil;
  if (expoKitDevelopmentUrl) {
    developmentUrl = expoKitDevelopmentUrl;
  } else if (shellConfig && shellConfig[@"developmentUrl"]) {
    DDLogWarn(@"Configuring your ExpoKit `developmentUrl` in EXShell.plist is deprecated, specify this in EXBuildConstants.plist instead.");
    developmentUrl = shellConfig[@"developmentUrl"];
  }
  
  if (developmentUrl) {
    _shellManifestUrl = developmentUrl;
    NSURLComponents *components = [NSURLComponents componentsWithURL:[NSURL URLWithString:_shellManifestUrl] resolvingAgainstBaseURL:YES];
    if ([self _isValidShellUrlScheme:components.scheme forDevelopment:YES]) {
      _urlScheme = components.scheme;
    }
  } else {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"You are running a detached app from Xcode, but it hasn't been configured for local development yet. "
                                           "You must run a packager for this Expo project before running it from XCode."
                                 userInfo:nil];
  }
}

- (void)_loadProductionUrlScheme
{
  NSDictionary *iosConfig = [[NSBundle mainBundle] infoDictionary];
  if (iosConfig[@"CFBundleURLTypes"]) {
    // if the shell app has a custom url scheme, read that.
    // this was configured when the shell app was built.
    NSArray *urlTypes = iosConfig[@"CFBundleURLTypes"];
    if (urlTypes && urlTypes.count) {
      NSDictionary *urlType = urlTypes[0];
      NSArray *urlSchemes = urlType[@"CFBundleURLSchemes"];
      if (urlSchemes) {
        for (NSString *urlScheme in urlSchemes) {
          if ([self _isValidShellUrlScheme:urlScheme forDevelopment:NO]) {
            _urlScheme = urlScheme;
            break;
          }
        }
      }
    }
  }
}

- (void)_loadMiscShellPropertiesWithConfig:(NSDictionary *)shellConfig
{
  _isManifestVerificationBypassed = [shellConfig[@"isManifestVerificationBypassed"] boolValue];
  _isRemoteJSEnabled = (shellConfig[@"isRemoteJSEnabled"] == nil)
    ? YES
    : [shellConfig[@"isRemoteJSEnabled"] boolValue];
  _loadJSInBackgroundExperimental = (shellConfig[@"loadJSInBackgroundExperimental"] == nil)
    ? NO
    : [shellConfig[@"loadJSInBackgroundExperimental"] boolValue];
  _testEnvironment = [EXTest testEnvironmentFromString:shellConfig[@"testEnvironment"]];
  _isSplashScreenDisabled = ([shellConfig[@"isSplashScreenDisabled"] boolValue]); // we can remove this when the old loading api is dead.
  _releaseChannel = (shellConfig[@"releaseChannel"] == nil) ? @"default" : shellConfig[@"releaseChannel"];
  // other shell config goes here
}

- (void)_setAnalyticsProperties
{
  [[EXAnalytics sharedInstance] setUserProperties:@{ @"INITIAL_URL": _shellManifestUrl }];
  [CrashlyticsKit setObjectValue:_shellManifestUrl forKey:@"initial_url"];
  if (self.isDetached) {
    [[EXAnalytics sharedInstance] setUserProperties:@{ @"IS_DETACHED": @YES }];
  }
}

/**
 *  Is this a valid url scheme for a standalone app?
 */
- (BOOL)_isValidShellUrlScheme:(NSString *)urlScheme forDevelopment:(BOOL)isForDevelopment
{
  // don't allow shell apps to intercept exp links
  if (urlScheme && urlScheme.length) {
    if (isForDevelopment) {
      return YES;
    } else {
      // prod shell apps must have some non-exp url scheme
      return (![urlScheme hasPrefix:@"exp"]);
    }
  }
  return NO;
}

@end
