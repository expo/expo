//
//  RNNativeViewHandler.m
//  RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "RNNativeViewHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <React/RCTConvert.h>
#import <React/UIView+React.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTScrollViewComponentView.h>
#else
#import <React/RCTScrollView.h>
#endif // RCT_NEW_ARCH_ENABLED

#pragma mark RNDummyGestureRecognizer

@implementation RNDummyGestureRecognizer {
  __weak RNGestureHandler *_gestureHandler;
}

- (id)initWithGestureHandler:(RNGestureHandler *)gestureHandler
{
  if ((self = [super initWithTarget:gestureHandler action:@selector(handleGesture:)])) {
    _gestureHandler = gestureHandler;
  }
  return self;
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [_gestureHandler.pointerTracker touchesBegan:touches withEvent:event];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [_gestureHandler.pointerTracker touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [_gestureHandler.pointerTracker touchesEnded:touches withEvent:event];
  self.state = UIGestureRecognizerStateFailed;
  [self reset];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [_gestureHandler.pointerTracker touchesCancelled:touches withEvent:event];
  self.state = UIGestureRecognizerStateCancelled;
  [self reset];
}

- (void)reset
{
  [_gestureHandler.pointerTracker reset];
  [super reset];
}

@end

#pragma mark RNNativeViewgestureHandler

@implementation RNNativeViewGestureHandler {
  BOOL _shouldActivateOnStart;
  BOOL _disallowInterruption;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
  if ((self = [super initWithTag:tag])) {
    _recognizer = [[RNDummyGestureRecognizer alloc] initWithGestureHandler:self];
  }
  return self;
}

- (void)configure:(NSDictionary *)config
{
  [super configure:config];
  _shouldActivateOnStart = [RCTConvert BOOL:config[@"shouldActivateOnStart"]];
  _disallowInterruption = [RCTConvert BOOL:config[@"disallowInterruption"]];
}

- (void)bindToView:(UIView *)view
{
  // For UIControl based views (UIButton, UISwitch) we provide special handling that would allow
  // for properties like `disallowInterruption` to work.
  if ([view isKindOfClass:[UIControl class]]) {
    UIControl *control = (UIControl *)view;
    [control addTarget:self action:@selector(handleTouchDown:forEvent:) forControlEvents:UIControlEventTouchDown];
    [control addTarget:self
                  action:@selector(handleTouchUpOutside:forEvent:)
        forControlEvents:UIControlEventTouchUpOutside];
    [control addTarget:self
                  action:@selector(handleTouchUpInside:forEvent:)
        forControlEvents:UIControlEventTouchUpInside];
    [control addTarget:self action:@selector(handleDragExit:forEvent:) forControlEvents:UIControlEventTouchDragExit];
    [control addTarget:self action:@selector(handleDragEnter:forEvent:) forControlEvents:UIControlEventTouchDragEnter];
    [control addTarget:self action:@selector(handleTouchCancel:forEvent:) forControlEvents:UIControlEventTouchCancel];
  } else {
    [super bindToView:view];
  }

  // We can restore default scrollview behaviour to delay touches to scrollview's children
  // because gesture handler system can handle cancellation of scroll recognizer when JS responder
  // is set
#ifdef RCT_NEW_ARCH_ENABLED
  if ([view isKindOfClass:[RCTScrollViewComponentView class]]) {
    UIScrollView *scrollView = ((RCTScrollViewComponentView *)view).scrollView;
    scrollView.delaysContentTouches = YES;
  }
#else
  if ([view isKindOfClass:[RCTScrollView class]]) {
    // This part of the code is coupled with RN implementation of ScrollView native wrapper and
    // we expect for RCTScrollView component to contain a subclass of UIScrollview as the only
    // subview
    UIScrollView *scrollView = [view.subviews objectAtIndex:0];
    scrollView.delaysContentTouches = YES;
  }
#endif // RCT_NEW_ARCH_ENABLED
}

- (void)handleTouchDown:(UIView *)sender forEvent:(UIEvent *)event
{
  [self reset];

  if (_disallowInterruption) {
    // When `disallowInterruption` is set we cancel all gesture handlers when this UIControl
    // gets DOWN event
    for (UITouch *touch in [event allTouches]) {
      for (UIGestureRecognizer *recogn in [touch gestureRecognizers]) {
        recogn.enabled = NO;
        recogn.enabled = YES;
      }
    }
  }

  [self sendEventsInState:RNGestureHandlerStateActive
           forViewWithTag:sender.reactTag
            withExtraData:[RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleTouchUpOutside:(UIView *)sender forEvent:(UIEvent *)event
{
  [self sendEventsInState:RNGestureHandlerStateEnd
           forViewWithTag:sender.reactTag
            withExtraData:[RNGestureHandlerEventExtraData forPointerInside:NO]];
}

- (void)handleTouchUpInside:(UIView *)sender forEvent:(UIEvent *)event
{
  [self sendEventsInState:RNGestureHandlerStateEnd
           forViewWithTag:sender.reactTag
            withExtraData:[RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleDragExit:(UIView *)sender forEvent:(UIEvent *)event
{
  // Pointer is moved outside of the view bounds, we cancel button when `shouldCancelWhenOutside` is set
  if (self.shouldCancelWhenOutside) {
    UIControl *control = (UIControl *)sender;
    [control cancelTrackingWithEvent:event];
    [self sendEventsInState:RNGestureHandlerStateEnd
             forViewWithTag:sender.reactTag
              withExtraData:[RNGestureHandlerEventExtraData forPointerInside:NO]];
  } else {
    [self sendEventsInState:RNGestureHandlerStateActive
             forViewWithTag:sender.reactTag
              withExtraData:[RNGestureHandlerEventExtraData forPointerInside:NO]];
  }
}

- (void)handleDragEnter:(UIView *)sender forEvent:(UIEvent *)event
{
  [self sendEventsInState:RNGestureHandlerStateActive
           forViewWithTag:sender.reactTag
            withExtraData:[RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleTouchCancel:(UIView *)sender forEvent:(UIEvent *)event
{
  [self sendEventsInState:RNGestureHandlerStateCancelled
           forViewWithTag:sender.reactTag
            withExtraData:[RNGestureHandlerEventExtraData forPointerInside:NO]];
}

@end
