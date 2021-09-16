// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppDefines.h>

@implementation EXAppDefines

static BOOL _inited = NO;
static BOOL _debug;
static BOOL _rctDebug;
static BOOL _rctDev;

+ (BOOL)APP_DEBUG
{
  [self throwIfNotInited];
  return _debug;
}

+ (BOOL)APP_RCT_DEBUG
{
  [self throwIfNotInited];
  return _rctDebug;
}

+ (BOOL)APP_RCT_DEV
{
  [self throwIfNotInited];
  return _rctDev;
}

+ (void)initDefines:(BOOL)debug
{
  [self initDefines:debug rctDebug:debug rctDev:debug];
}

+ (void)initDefines:(BOOL)debug
           rctDebug:(BOOL)rctDebug
             rctDev:(BOOL)rctDev
{
  if (_inited) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"EXAppDefines is already initialized"
                                 userInfo:nil];
  }
  _inited = YES;
  _debug = debug;
  _rctDebug = rctDebug;
  _rctDev = rctDev;
}

+ (void)throwIfNotInited
{
  if (!_inited) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"EXAppDefines is not yet initialized. Check https://expo.fyi/expo-modules-migration for more information."
                                 userInfo:nil];
  }
}

@end
