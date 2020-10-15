/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "SKTapListenerImpl.h"

#import "SKHiddenWindow.h"

#import <FlipperKitHighlightOverlay/SKHighlightOverlay.h>

@implementation SKTapListenerImpl {
  NSMutableArray<SKTapReceiver>* _receiversWaitingForInput;
  UITapGestureRecognizer* _gestureRecognizer;

  SKHiddenWindow* _overlayWindow;
}

@synthesize isMounted = _isMounted;

- (instancetype)init {
  if (self = [super init]) {
    _receiversWaitingForInput = [NSMutableArray new];

    _gestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self
                                                                 action:nil];
    _gestureRecognizer.delegate = self;

    _isMounted = NO;

    _overlayWindow = [SKHiddenWindow new];
    _overlayWindow.hidden = YES;
    _overlayWindow.windowLevel = UIWindowLevelAlert;
    _overlayWindow.backgroundColor = [SKHighlightOverlay overlayColor];

    [_overlayWindow addGestureRecognizer:_gestureRecognizer];
  }

  return self;
}

- (void)mountWithFrame:(CGRect)frame {
  if (_isMounted) {
    return;
  }

  [_overlayWindow setFrame:frame];
  [_overlayWindow makeKeyAndVisible];
  _overlayWindow.hidden = NO;
  [[UIApplication sharedApplication].delegate.window addSubview:_overlayWindow];
  _isMounted = YES;
}

- (void)unmount {
  if (!_isMounted) {
    return;
  }

  [_receiversWaitingForInput removeAllObjects];
  [_overlayWindow removeFromSuperview];
  _overlayWindow.hidden = YES;
  _isMounted = NO;
}

- (void)listenForTapWithBlock:(SKTapReceiver)receiver {
  [_receiversWaitingForInput addObject:receiver];
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer*)gestureRecognizer
       shouldReceiveTouch:(UITouch*)touch {
  if ([_receiversWaitingForInput count] == 0) {
    return YES;
  }

  CGPoint touchPoint = [touch locationInView:_overlayWindow];

  for (SKTapReceiver recv in _receiversWaitingForInput) {
    recv(touchPoint);
  }

  [_receiversWaitingForInput removeAllObjects];

  return NO;
}

@end

#endif
