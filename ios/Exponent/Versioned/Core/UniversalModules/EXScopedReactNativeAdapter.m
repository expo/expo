// Copyright © 2018 650 Industries. All rights reserved.

#import "EXScopedReactNativeAdapter.h"
#import "EXUnversioned.h"

@interface UMReactNativeAdapter (Protected)

- (void)startObserving;

@end

@implementation EXScopedReactNativeAdapter

- (void)setBridge:(RCTBridge *)bridge
{
  if (bridge) {
    [super setBridge:bridge];
    [self setAppStateToForeground];
  }
}

- (void)startObserving
{
  // EXAppState and EXKernel handle this for us
}

@end
