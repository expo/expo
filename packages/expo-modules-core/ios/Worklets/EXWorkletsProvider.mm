// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/EXWorkletsProvider.h>
#import <ExpoModulesWorklets/EXWorkletsProvider+Private.h>

@implementation EXWorkletsProviderRegistry

// Written exactly once from `ExpoWorkletsBridgeProvider`'s `+load`, which the
// ObjC runtime guarantees runs before `main` and therefore before any reader
// thread exists. After that the value is read-only — no locking required.
static id<EXWorkletsProvider> _sharedProvider = nil;

+ (nullable id<EXWorkletsProvider>)shared
{
  return _sharedProvider;
}

+ (void)setShared:(nullable id<EXWorkletsProvider>)shared
{
  _sharedProvider = shared;
}

@end
