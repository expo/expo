// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXAppDefines.h>
#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>

@implementation ABI48_0_0EXAppDefines

static NSDictionary *_storage;
static BOOL _loaded = NO;

+ (BOOL)APP_DEBUG
{
  [self throwIfNotLoaded];
  return [_storage[@"APP_DEBUG"] boolValue];
}

+ (BOOL)APP_RCT_DEBUG
{
  [self throwIfNotLoaded];
  return [_storage[@"APP_RCT_DEBUG"] boolValue];
}

+ (BOOL)APP_RCT_DEV
{
  [self throwIfNotLoaded];
  return [_storage[@"APP_RCT_DEV"] boolValue];
}

+ (BOOL)APP_NEW_ARCH_ENABLED
{
  [self throwIfNotLoaded];
  return [_storage[@"APP_NEW_ARCH_ENABLED"] boolValue];
}

+ (NSDictionary *)getAllDefines
{
  return _storage;
}

+ (void)load:(NSDictionary *)defines
{
  NSAssert([NSThread isMainThread], @"This function must be called on main thread");
  NSAssert(!_loaded, @"ABI48_0_0EXAppDefines is already loaded");
  if (!_loaded) {
    _storage = defines;
    _loaded = YES;
  }
}

// Private function for ABI48_0_0EXAppDefinesTest to unload the current state.
+ (void)_unload
{
  _storage = nil;
  _loaded = NO;
}

+ (void)throwIfNotLoaded
{
  if (!_loaded) {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException
                                   reason:@"ABI48_0_0EXAppDefines is not loaded."
                                 userInfo:nil];
  }
}


@end
