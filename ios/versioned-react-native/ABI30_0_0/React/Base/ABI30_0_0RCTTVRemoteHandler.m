/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTTVRemoteHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import "ABI30_0_0RCTAssert.h"
#import "ABI30_0_0RCTBridge.h"
#import "ABI30_0_0RCTEventDispatcher.h"
#import "ABI30_0_0RCTLog.h"
#import "ABI30_0_0RCTRootView.h"
#import "ABI30_0_0RCTTVNavigationEventEmitter.h"
#import "ABI30_0_0RCTUIManager.h"
#import "ABI30_0_0RCTUtils.h"
#import "ABI30_0_0RCTView.h"
#import "UIView+ReactABI30_0_0.h"

#if __has_include("ABI30_0_0RCTDevMenu.h")
#import "ABI30_0_0RCTDevMenu.h"
#endif

NSString *const ABI30_0_0RCTTVRemoteEventMenu = @"menu";
NSString *const ABI30_0_0RCTTVRemoteEventPlayPause = @"playPause";
NSString *const ABI30_0_0RCTTVRemoteEventSelect = @"select";

NSString *const ABI30_0_0RCTTVRemoteEventLongPlayPause = @"longPlayPause";
NSString *const ABI30_0_0RCTTVRemoteEventLongSelect = @"longSelect";

NSString *const ABI30_0_0RCTTVRemoteEventLeft = @"left";
NSString *const ABI30_0_0RCTTVRemoteEventRight = @"right";
NSString *const ABI30_0_0RCTTVRemoteEventUp = @"up";
NSString *const ABI30_0_0RCTTVRemoteEventDown = @"down";

NSString *const ABI30_0_0RCTTVRemoteEventSwipeLeft = @"swipeLeft";
NSString *const ABI30_0_0RCTTVRemoteEventSwipeRight = @"swipeRight";
NSString *const ABI30_0_0RCTTVRemoteEventSwipeUp = @"swipeUp";
NSString *const ABI30_0_0RCTTVRemoteEventSwipeDown = @"swipeDown";


@implementation ABI30_0_0RCTTVRemoteHandler {
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
                                         name:ABI30_0_0RCTTVRemoteEventPlayPause];

    // Menu
    [self addTapGestureRecognizerWithSelector:@selector(menuPressed:)
                                    pressType:UIPressTypeMenu
                                         name:ABI30_0_0RCTTVRemoteEventMenu];

    // Select
    [self addTapGestureRecognizerWithSelector:@selector(selectPressed:)
                                    pressType:UIPressTypeSelect
                                         name:ABI30_0_0RCTTVRemoteEventSelect];

    // Up
    [self addTapGestureRecognizerWithSelector:@selector(swipedUp:)
                                    pressType:UIPressTypeUpArrow
                                         name:ABI30_0_0RCTTVRemoteEventUp];

    // Down
    [self addTapGestureRecognizerWithSelector:@selector(swipedDown:)
                                    pressType:UIPressTypeDownArrow
                                         name:ABI30_0_0RCTTVRemoteEventDown];

    // Left
    [self addTapGestureRecognizerWithSelector:@selector(swipedLeft:)
                                    pressType:UIPressTypeLeftArrow
                                         name:ABI30_0_0RCTTVRemoteEventLeft];

    // Right
    [self addTapGestureRecognizerWithSelector:@selector(swipedRight:)
                                    pressType:UIPressTypeRightArrow
                                         name:ABI30_0_0RCTTVRemoteEventRight];

    // Recognizers for long button presses
    // We don't intercept long menu press -- that's used by the system to go to the home screen

    [self addLongPressGestureRecognizerWithSelector:@selector(longPlayPausePressed:)
                                          pressType:UIPressTypePlayPause
                                               name:ABI30_0_0RCTTVRemoteEventLongPlayPause];

    [self addLongPressGestureRecognizerWithSelector:@selector(longSelectPressed:)
                                          pressType:UIPressTypeSelect
                                               name:ABI30_0_0RCTTVRemoteEventLongSelect];

    // Recognizers for Apple TV remote trackpad swipes

    // Up
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedUp:)
                                      direction:UISwipeGestureRecognizerDirectionUp
                                           name:ABI30_0_0RCTTVRemoteEventSwipeUp];

    // Down
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedDown:)
                                      direction:UISwipeGestureRecognizerDirectionDown
                                           name:ABI30_0_0RCTTVRemoteEventSwipeDown];

    // Left
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedLeft:)
                                      direction:UISwipeGestureRecognizerDirectionLeft
                                           name:ABI30_0_0RCTTVRemoteEventSwipeLeft];

    // Right
    [self addSwipeGestureRecognizerWithSelector:@selector(swipedRight:)
                                      direction:UISwipeGestureRecognizerDirectionRight
                                           name:ABI30_0_0RCTTVRemoteEventSwipeRight];

  }

  return self;
}

- (void)playPausePressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI30_0_0RCTTVRemoteEventPlayPause toView:r.view];
}

- (void)menuPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI30_0_0RCTTVRemoteEventMenu toView:r.view];
}

- (void)selectPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI30_0_0RCTTVRemoteEventSelect toView:r.view];
}

- (void)longPlayPausePressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI30_0_0RCTTVRemoteEventLongPlayPause toView:r.view];

#if __has_include("ABI30_0_0RCTDevMenu.h") && ABI30_0_0RCT_DEV
  // If shake to show is enabled on device, use long play/pause event to show dev menu
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI30_0_0RCTShowDevMenuNotification object:nil];
#endif
}

- (void)longSelectPressed:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI30_0_0RCTTVRemoteEventLongSelect toView:r.view];
}

- (void)swipedUp:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI30_0_0RCTTVRemoteEventUp toView:r.view];
}

- (void)swipedDown:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI30_0_0RCTTVRemoteEventDown toView:r.view];
}

- (void)swipedLeft:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI30_0_0RCTTVRemoteEventLeft toView:r.view];
}

- (void)swipedRight:(UIGestureRecognizer *)r
{
  [self sendAppleTVEvent:ABI30_0_0RCTTVRemoteEventRight toView:r.view];
}

#pragma mark -

- (void)addLongPressGestureRecognizerWithSelector:(nonnull SEL)selector pressType:(UIPressType)pressType name:(NSString *)name
{
  UILongPressGestureRecognizer *recognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.allowedPressTypes = @[@(pressType)];

  _tvRemoteGestureRecognizers[name] = recognizer;
}

- (void)addTapGestureRecognizerWithSelector:(nonnull SEL)selector pressType:(UIPressType)pressType name:(NSString *)name
{
  UITapGestureRecognizer *recognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.allowedPressTypes = @[@(pressType)];

  _tvRemoteGestureRecognizers[name] = recognizer;
}

- (void)addSwipeGestureRecognizerWithSelector:(nonnull SEL)selector direction:(UISwipeGestureRecognizerDirection)direction name:(NSString *)name
{
  UISwipeGestureRecognizer *recognizer = [[UISwipeGestureRecognizer alloc] initWithTarget:self action:selector];
  recognizer.direction = direction;

  _tvRemoteGestureRecognizers[name] = recognizer;
}

- (void)sendAppleTVEvent:(NSString *)eventType toView:(__unused UIView *)v
{
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI30_0_0RCTTVNavigationEventNotification
                                                      object:@{@"eventType":eventType}];
}


@end
