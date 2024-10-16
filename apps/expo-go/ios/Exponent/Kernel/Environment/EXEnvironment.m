// Copyright 2015-present 650 Industries. All rights reserved.

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

#pragma mark - internal

- (void)_reset
{
  _isDebugXCodeScheme = NO;
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
