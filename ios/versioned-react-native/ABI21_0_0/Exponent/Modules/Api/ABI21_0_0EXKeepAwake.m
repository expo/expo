// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXKeepAwake.h"
#import "ABI21_0_0EXUnversioned.h"

#import <UIKit/UIKit.h>

@implementation ABI21_0_0EXKeepAwake
{
  BOOL _active;
}

@synthesize bridge = _bridge;

ABI21_0_0RCT_EXPORT_MODULE(ExponentKeepAwake);

- (void)setBridge:(ABI21_0_0RCTBridge *)bridge
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

ABI21_0_0RCT_EXPORT_METHOD(activate)
{
  _active = YES;
  [self _performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
  }];
}

ABI21_0_0RCT_EXPORT_METHOD(deactivate)
{
  _active = NO;
  [self _performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

- (void)bridgeDidForeground:(NSNotification *)notification
{
  if (_active) {
    [self _performSynchronouslyOnMainThread:^{
      [[UIApplication sharedApplication] setIdleTimerDisabled:YES];
    }];
  }
}

- (void)bridgeDidBackground:(NSNotification *)notification
{
  [self _performSynchronouslyOnMainThread:^{
    [[UIApplication sharedApplication] setIdleTimerDisabled:NO];
  }];
}

#pragma mark - internal

- (void)_performSynchronouslyOnMainThread:(void (^)(void))block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_sync(dispatch_get_main_queue(), block);
  }
}

@end
