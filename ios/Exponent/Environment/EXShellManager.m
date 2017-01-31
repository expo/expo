// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAnalytics.h"
#import "EXShellManager.h"
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
    [self _loadShellConfig];
  }
  return self;
}

#pragma mark internal

- (void)_reset
{
  _isShell = NO;
  _shellManifestUrl = nil;
  _usesPublishedManifest = YES;
  _urlScheme = nil;
  _allManifestUrls = @[];
}

- (void)_loadShellConfig
{
  [self _reset];
  NSString *configPath = [[NSBundle mainBundle] pathForResource:@"EXShell" ofType:@"plist"];
  NSMutableDictionary *mutableConfig = (configPath) ? [NSMutableDictionary dictionaryWithContentsOfFile:configPath] : [NSMutableDictionary dictionary];
  NSMutableArray *allManifestUrls = [NSMutableArray array];

  if (mutableConfig) {
    _isShell = [mutableConfig[@"isShell"] boolValue];
    if (_isShell) {
      _shellManifestUrl = mutableConfig[@"manifestUrl"];
      if (_shellManifestUrl) {
        [allManifestUrls addObject:_shellManifestUrl];
      }
#if DEBUG
      if (mutableConfig[@"developmentUrl"]) {
        _shellManifestUrl = mutableConfig[@"developmentUrl"];
        [allManifestUrls addObject:mutableConfig[@"developmentUrl"]];
        NSURLComponents *components = [NSURLComponents componentsWithURL:[NSURL URLWithString:_shellManifestUrl] resolvingAgainstBaseURL:YES];
        if ([self _isValidShellUrlScheme:components.scheme]) {
          _urlScheme = components.scheme;
        }
        _usesPublishedManifest = NO;
      } else {
        NSAssert(NO, @"No development url was configured. You must open this project with Exponent before running it from XCode.");
      }
#else
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
              if ([self _isValidShellUrlScheme:urlScheme]) {
                _urlScheme = urlScheme;
                break;
              }
            }
          }
        }
      }
#endif
      RCTAssert((_shellManifestUrl), @"This app is configured to be a standalone app, but does not specify a standalone experience url.");
      // other shell config goes here

      [[EXAnalytics sharedInstance] setUserProperties:@{ @"INITIAL_URL": _shellManifestUrl }];
    }
  }
  _allManifestUrls = allManifestUrls;
}

- (BOOL)isShellUrlScheme:(NSString *)scheme
{
  return false;//(_urlScheme && [scheme isEqualToString:_urlScheme]);
}

- (BOOL)hasUrlScheme
{
  return (_urlScheme != nil);
}

- (BOOL)_isValidShellUrlScheme:(NSString *)urlScheme
{
  // don't allow shell apps to intercept exp links
  return (urlScheme && urlScheme.length && ![urlScheme hasPrefix:@"exp"]);
}

@end
