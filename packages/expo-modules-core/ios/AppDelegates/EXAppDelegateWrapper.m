// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

// Only include RCTHost in new architecture builds
#if __has_include(<React/RCTHost.h>) && RCT_NEW_ARCH_ENABLED
#import <React/RCTHost.h>
#import "EXHBCRuntimeManager+Singleton.h"

@interface EXAppDelegateWrapper : NSObject <RCTHostDelegate>
@end

@implementation EXAppDelegateWrapper

- (void)hostDidStart:(RCTHost *)host
{
  NSLog(@"🎯 EXAppDelegateWrapper: hostDidStart called - setting up HBC runtime delegate");
  
  // Set up the runtime delegate for HBC injection
  host.runtimeDelegate = [EXHBCRuntimeManagerSingleton createRuntimeDelegateForHost:host];
  
  NSLog(@"🎯 EXAppDelegateWrapper: Runtime delegate set successfully");
}

@end

#endif