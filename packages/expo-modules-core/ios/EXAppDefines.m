// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppDefines.h>
#import <React/RCTDefines.h>

@implementation EXAppDefines

static BOOL _debug;
static BOOL _rctDebug;
static BOOL _rctDev;
static BOOL _loaded = NO;

+ (BOOL)APP_DEBUG
{
  [self throwIfNotLoaded];
  return _debug;
}

+ (BOOL)APP_RCT_DEBUG
{
  [self throwIfNotLoaded];
  return _rctDebug;
}

+ (BOOL)APP_RCT_DEV
{
  [self throwIfNotLoaded];
  return _rctDev;
}

+ (void)load:(BOOL)APP_DEBUG APP_RCT_DEBUG:(BOOL)APP_RCT_DEBUG APP_RCT_DEV:(BOOL)APP_RCT_DEV
{
  NSAssert([NSThread isMainThread], @"This function must be called on main thread");
  NSAssert(!_loaded, @"EXAppDefines is already loaded");
  if (!_loaded) {
    _debug = APP_DEBUG;
    _rctDebug = APP_RCT_DEBUG;
    _rctDev = APP_RCT_DEV;
    _loaded = YES;
  }
}

+ (void)throwIfNotLoaded
{
  if (!_loaded) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"EXAppDefines is not loaded."
                                 userInfo:nil];
  }
}

@end
