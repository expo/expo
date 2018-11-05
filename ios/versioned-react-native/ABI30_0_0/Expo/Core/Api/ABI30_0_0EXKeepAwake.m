// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXKeepAwake.h"
#import "ABI30_0_0EXUnversioned.h"
#import "ABI30_0_0EXUtil.h"

#import <UIKit/UIKit.h>

@implementation ABI30_0_0EXKeepAwake
{
  BOOL _active;
}

@synthesize bridge = _bridge;

ABI30_0_0RCT_EXPORT_MODULE(ExponentKeepAwake);

- (void)setBridge:(ABI30_0_0RCTBridge *)bridge
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

ABI30_0_0RCT_EXPORT_METHOD(activate)
{
  _active = YES;
  [ABI30_0_0EXUtil performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
  }];
}

ABI30_0_0RCT_EXPORT_METHOD(deactivate)
{
  _active = NO;
  [ABI30_0_0EXUtil performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  if (_active) {
    [ABI30_0_0EXUtil performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  [ABI30_0_0EXUtil performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

@end
