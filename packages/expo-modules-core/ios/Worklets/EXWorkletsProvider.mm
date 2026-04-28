// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/EXWorkletsProvider.h>

@implementation EXWorkletsProviderRegistry

static id<EXWorkletsProvider> _sharedProvider = nil;

+ (nullable id<EXWorkletsProvider>)shared
{
  @synchronized(self) {
    return _sharedProvider;
  }
}

+ (void)setShared:(nullable id<EXWorkletsProvider>)shared
{
  @synchronized(self) {
    _sharedProvider = shared;
  }
}

@end
