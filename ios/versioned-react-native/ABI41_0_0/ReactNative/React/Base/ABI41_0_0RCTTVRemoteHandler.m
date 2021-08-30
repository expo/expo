/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTTVRemoteHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import "ABI41_0_0RCTAssert.h"
#import "ABI41_0_0RCTBridge.h"
#import "ABI41_0_0RCTEventDispatcher.h"
#import "ABI41_0_0RCTLog.h"
#import "ABI41_0_0RCTRootView.h"
#import "ABI41_0_0RCTTVNavigationEventEmitter.h"
#import "ABI41_0_0RCTUIManager.h"
#import "ABI41_0_0RCTUtils.h"
#import "ABI41_0_0RCTView.h"
#import "ABI41_0_0UIView+React.h"

#if __has_include("ABI41_0_0RCTDevMenu.h")
#import "ABI41_0_0RCTDevMenu.h"
#endif

NSString *const ABI41_0_0RCTTVRemoteEventMenu = @"menu";
NSString *const ABI41_0_0RCTTVRemoteEventPlayPause = @"playPause";
NSString *const ABI41_0_0RCTTVRemoteEventSelect = @"select";

NSString *const ABI41_0_0RCTTVRemoteEventLongPlayPause = @"longPlayPause";
NSString *const ABI41_0_0RCTTVRemoteEventLongSelect = @"longSelect";

NSString *const ABI41_0_0RCTTVRemoteEventLeft = @"left";
NSString *const ABI41_0_0RCTTVRemoteEventRight = @"right";
NSString *const ABI41_0_0RCTTVRemoteEventUp = @"up";
NSString *const ABI41_0_0RCTTVRemoteEventDown = @"down";

NSString *const ABI41_0_0RCTTVRemoteEventSwipeLeft = @"swipeLeft";
NSString *const ABI41_0_0RCTTVRemoteEventSwipeRight = @"swipeRight";
NSString *const ABI41_0_0RCTTVRemoteEventSwipeUp = @"swipeUp";
NSString *const ABI41_0_0RCTTVRemoteEventSwipeDown = @"swipeDown";

@implementation ABI41_0_0RCTTVRemoteHandler {
  NSMutableDictionary<NSString *, UIGestureRecognizer *> *_tvRemoteGestureRecognizers;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _tvRemoteGestureRecognizers = [NSMutableDictionary dictionary];

    // Recognizers for Apple TV remote buttons

    // Play/Pause
    [self addTapGestureRecognizerWithSelector:@selector(playPausePressed:)
                                    pressType:UIPressTypePlayPause
                                         name:ABI41_0_0RCTTVRemoteEventPlayPause];

    // Menu
    [self addTapGestureRecognizerWithSelector:@selector(menuPressed:)
                                    pressType:UIPressTypeMenu
                                         name:ABI41_0_0RCTTVRemoteEventMenu];

    // Select
    [self addTapGestureRecognizerWithSelector:@selector(selectPressed:)
                                    pressType:UIPressTypeSelect
                                         name:ABI41_0_0RCTTVRemoteEventSelect];

    // Up
    [self addTapGestureRecognizerWithSelector:@selector(tappedUp:)
                                    pressType:UIPressTypeUpArrow
                                         name:ABI41_0_0RCTTVRemoteEventUp];

    // Down
    [self addTapGestureRecognizerWithSelector:@selector(tappedDown:)
                                    pressType:UIPressTypeDownArrow
                                         name:ABI41_0_0RCTTVRemoteEventDown];

    // Left
    [self addTapGestureRecognizerWithSelector:@selector(tappedLeft:)
                                    pressType:UIPressTypeLeftArrow
                                         name:ABI41_0_0RCTTVRemoteEventLeft];

    // Right
    [self addTapGestureRecognizerWithSelector:@selector(tappedRight:)
                                    pressType:UIPressTypeRightArrow
                                         name:ABI41_0_0RCTTVRemoteEventRight];

    // Recognizers for long button presses
    // We don't intercept long menu press -- that's used by the system to go to the home screen

    [self addLongPressGestureRecognizerWithSelector:@selector(longPlayPausePressed:)
                                          pressType:UIPressTypePlayPause
                                               name:ABI41_0_0RCTTVRemoteEventLongPlayPause];

    [self addLongPressGestureRecognizerWithSelector:@selector(longSelectPressed:)
                                          pressType:UIPressTypeSelect
                                               name:ABI41_0_0RCTTVRemoteEventLongSelect];

    // Recognizers for Apple TV remote trackpad swipes

    // Up
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedUp:)
                                      direction:UISwipeGestureRecognizerDirectionUp
                                           name:ABI41_0_0RCTTVRemoteEventSwipeUp];

    // Down
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedDown:)
                                      direction:UISwipeGestureRecognizerDirectionDown
                                           name:ABI41_0_0RCTTVRemoteEventSwipeDown];

    // Left
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedLeft:)
                                      direction:UISwipeGestureRecognizerDirectionLeft
                                           name:ABI41_0_0RCTTVRemoteEventSwipeLeft];

    // Right
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedRight:)
                                      direction:UISwipeGestureRecognizerDirectionRight
                                           name:ABI41_0_0RCTTVRemoteEventSwipeRight];
  }

  return self;
}

- (void)playPausePressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventPlayPause toView:r.view];
}

- (void)menuPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventMenu toView:r.view];
}

- (void)selectPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventSelect toView:r.view];
}

- (void)longPlayPausePressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventLongPlayPause toView:r.view];

#if __has_include("ABI41_0_0RCTDevMenu.h") && ABI41_0_0RCT_DEV
  // If shake to show is enabled on device, use long play/pause event to show dev menu
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI41_0_0RCTShowDevMenuNotification object:nil];
#endif
}

- (void)longSelectPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventLongSelect toView:r.view];
}

- (void)swipedUp:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventSwipeUp toView:r.view];
}

- (void)swipedDown:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventSwipeDown toView:r.view];
}

- (void)swipedLeft:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventSwipeLeft toView:r.view];
}

- (void)swipedRight:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventSwipeRight toView:r.view];
}

- (void)tappedUp:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventUp toView:r.view];
}

- (void)tappedDown:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventDown toView:r.view];
}

- (void)tappedLeft:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventLeft toView:r.view];
}

- (void)tappedRight:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI41_0_0RCTTVRemoteEventRight toView:r.view];
}

#pragma mark -

- (void)addLongPressGestureRecognizerWithSelector:(nonnull SEL)selector
                                        pressType:(UIPressType)pressType
                                             name:(NSString *)name
{
  UILongPressGestureRecognizer *recognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.allowedPressTypes = @[ @(pressType) ];

  _tvRemoteGestureRecognizers[name] = recognizer;
}

- (void)addTapGestureRecognizerWithSelector:(nonnull SEL)selector pressType:(UIPressType)pressType name:(NSString *)name
{
  UITapGestureRecognizer *recognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.allowedPressTypes = @[ @(pressType) ];

  _tvRemoteGestureRecognizers[name] = recognizer;
}

- (void)addSwipeGestureRecognizerWithSelector:(nonnull SEL)selector
                                    direction:(UISwipeGestureRecognizerDirection)direction
                                         name:(NSString *)name
{
  UISwipeGestureRecognizer *recognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.direction = direction;

  _tvRemoteGestureRecognizers[name] = recognizer;
}

- (void)sendAppleTVEvent:(NSString *)eventType toView:(__unused UIView *)v
{
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI41_0_0RCTTVNavigationEventNotification
                                                      object:@{@"eventType" : eventType}];
}

@end
