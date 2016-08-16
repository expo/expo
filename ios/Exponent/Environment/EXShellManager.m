// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXShellManager.h"

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
}

- (void)_loadShellConfig
{
  [self _reset];
  NSString *configPath = [[NSBundle mainBundle] pathForResource:@"EXShell" ofType:@"plist"];
  NSMutableDictionary *mutableConfig = (configPath) ? [NSMutableDictionary dictionaryWithContentsOfFile:configPath] : [NSMutableDictionary dictionary];

  if (mutableConfig) {
    _isShell = [mutableConfig[@"isShell"] boolValue];
    if (_isShell) {
      _shellManifestUrl = mutableConfig[@"manifestUrl"];
      // other shell config goes here
    }
    
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
            if (urlScheme.length && ![urlScheme hasPrefix:@"exp"]) {
              _urlScheme = urlScheme;
              break;
            }
          }
        }
      }
    }
  }
}

@end
