// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBuildConstants.h"
#import "EXKernelUtil.h"
#import "ExpoKit.h"
#import "EXEnvironment.h"

#import <React/RCTUtils.h>

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

- (BOOL)hasUrlScheme
{
  return (_urlScheme != nil);
}

#pragma mark - internal

- (void)_reset
{
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
  BOOL isDebugXCodeScheme = NO;
#if DEBUG
  isDebugXCodeScheme = YES;
#endif
  
  [self _resetAndLoadIsDebugXCodeScheme:isDebugXCodeScheme];
}

- (void)_resetAndLoadIsDebugXCodeScheme:(BOOL)isDebugScheme {
  [self _reset];
  _isDebugXCodeScheme = isDebugScheme;
}

@end
