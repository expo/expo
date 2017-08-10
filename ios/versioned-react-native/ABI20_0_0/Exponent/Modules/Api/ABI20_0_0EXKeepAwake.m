// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI20_0_0EXKeepAwake.h"
#import "ABI20_0_0EXUnversioned.h"

#import <UIKit/UIKit.h>

@implementation ABI20_0_0EXKeepAwake
{
  BOOL _active;
}

@synthesize bridge = _bridge;

ABI20_0_0RCT_EXPORT_MODULE(ExponentKeepAwake);

- (void)setBridge:(ABI20_0_0RCTBridge *)bridge
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

ABI20_0_0RCT_EXPORT_METHOD(activate)
{
  _active = YES;
  [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
}

ABI20_0_0RCT_EXPORT_METHOD(deactivate)
{
  _active = NO;
  [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  if (_active) {
    [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
}

@end
