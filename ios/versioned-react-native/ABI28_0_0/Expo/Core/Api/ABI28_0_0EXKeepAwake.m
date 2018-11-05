// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI28_0_0EXKeepAwake.h"
#import "ABI28_0_0EXUnversioned.h"
#import "ABI28_0_0EXUtil.h"

#import <UIKit/UIKit.h>

@implementation ABI28_0_0EXKeepAwake
{
  BOOL _active;
}

@synthesize bridge = _bridge;

ABI28_0_0RCT_EXPORT_MODULE(ExponentKeepAwake);

- (void)setBridge:(ABI28_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  _active = NO;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidForeground:)
                                               name:@"EXKernelBridgeDidForegroundNotification"
                                             object:bridge];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(bridgeDidBackground:)
                                               name:@"EXKernelBridgeDidBackgroundNotification"
                                             object:bridge];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

ABI28_0_0RCT_EXPORT_METHOD(activate)
{
  _active = YES;
  [ABI28_0_0EXUtil performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
  }];
}

ABI28_0_0RCT_EXPORT_METHOD(deactivate)
{
  _active = NO;
  [ABI28_0_0EXUtil performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  if (_active) {
    [ABI28_0_0EXUtil performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  [ABI28_0_0EXUtil performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

@end
