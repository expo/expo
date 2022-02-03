//
//  ABI44_0_0RNNativeViewHandler.m
//  ABI44_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI44_0_0RNNativeViewHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>
#import <ABI44_0_0React/ABI44_0_0RCTScrollView.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>

#pragma mark ABI44_0_0RNDummyGestureRecognizer

@implementation ABI44_0_0RNDummyGestureRecognizer {
  __weak ABI44_0_0RNGestureHandler *_gestureHandler;
}

- (id)initWithGestureHandler:(ABI44_0_0RNGestureHandler *)gestureHandler
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

-(void)reset
{
  [_gestureHandler.pointerTracker reset];
  [super reset];
}

@end

#pragma mark ABI44_0_0RNNativeViewgestureHandler

@implementation ABI44_0_0RNNativeViewGestureHandler {
    BOOL _shouldActivateOnStart;
    BOOL _disallowInterruption;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[ABI44_0_0RNDummyGestureRecognizer alloc] initWithGestureHandler:self];
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    _shouldActivateOnStart = [ABI44_0_0RCTConvert BOOL:config[@"shouldActivateOnStart"]];
    _disallowInterruption = [ABI44_0_0RCTConvert BOOL:config[@"disallowInterruption"]];
}

- (void)bindToView:(UIView *)view
{
    // For UIControl based views (UIButton, UISwitch) we provide special handling that would allow
    // for properties like `disallowInterruption` to work.
    if ([view isKindOfClass:[UIControl class]]) {
        UIControl *control = (UIControl *)view;
        [control addTarget:self action:@selector(handleTouchDown:forEvent:) forControlEvents:UIControlEventTouchDown];
        [control addTarget:self action:@selector(handleTouchUpOutside:forEvent:) forControlEvents:UIControlEventTouchUpOutside];
        [control addTarget:self action:@selector(handleTouchUpInside:forEvent:) forControlEvents:UIControlEventTouchUpInside];
        [control addTarget:self action:@selector(handleDragExit:forEvent:) forControlEvents:UIControlEventTouchDragExit];
        [control addTarget:self action:@selector(handleDragEnter:forEvent:) forControlEvents:UIControlEventTouchDragEnter];
        [control addTarget:self action:@selector(handleTouchCancel:forEvent:) forControlEvents:UIControlEventTouchCancel];
    } else {
        [super bindToView:view];
    }

    // We can restore default scrollview behaviour to delay touches to scrollview's children
    // because gesture handler system can handle cancellation of scroll recognizer when JS responder
    // is set
    if ([view isKindOfClass:[ABI44_0_0RCTScrollView class]]) {
        // This part of the code is coupled with RN implementation of ScrollView native wrapper and
        // we expect for ABI44_0_0RCTScrollView component to contain a subclass of UIScrollview as the only
        // subview
        UIScrollView *scrollView = [view.subviews objectAtIndex:0];
        scrollView.delaysContentTouches = YES;
    }
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

    [self sendEventsInState:ABI44_0_0RNGestureHandlerStateActive
             forViewWithTag:sender.ABI44_0_0ReactTag
              withExtraData:[ABI44_0_0RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleTouchUpOutside:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI44_0_0RNGestureHandlerStateEnd
             forViewWithTag:sender.ABI44_0_0ReactTag
              withExtraData:[ABI44_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
}

- (void)handleTouchUpInside:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI44_0_0RNGestureHandlerStateEnd
             forViewWithTag:sender.ABI44_0_0ReactTag
              withExtraData:[ABI44_0_0RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleDragExit:(UIView *)sender forEvent:(UIEvent *)event
{
    // Pointer is moved outside of the view bounds, we cancel button when `shouldCancelWhenOutside` is set
    if (self.shouldCancelWhenOutside) {
        UIControl *control = (UIControl *)sender;
        [control cancelTrackingWithEvent:event];
        [self sendEventsInState:ABI44_0_0RNGestureHandlerStateEnd
                 forViewWithTag:sender.ABI44_0_0ReactTag
                  withExtraData:[ABI44_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
    } else {
        [self sendEventsInState:ABI44_0_0RNGestureHandlerStateActive
                 forViewWithTag:sender.ABI44_0_0ReactTag
                  withExtraData:[ABI44_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
    }
}

- (void)handleDragEnter:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI44_0_0RNGestureHandlerStateActive
             forViewWithTag:sender.ABI44_0_0ReactTag
              withExtraData:[ABI44_0_0RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleTouchCancel:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI44_0_0RNGestureHandlerStateCancelled
             forViewWithTag:sender.ABI44_0_0ReactTag
              withExtraData:[ABI44_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
}

@end
