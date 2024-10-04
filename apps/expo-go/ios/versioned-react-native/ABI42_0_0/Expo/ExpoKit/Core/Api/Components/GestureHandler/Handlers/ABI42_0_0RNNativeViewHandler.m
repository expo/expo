//
//  ABI42_0_0RNNativeViewHandler.m
//  ABI42_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI42_0_0RNNativeViewHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTScrollView.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>

#pragma mark ABI42_0_0RNDummyGestureRecognizer

@implementation ABI42_0_0RNDummyGestureRecognizer

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    self.state = UIGestureRecognizerStateFailed;
    [self reset];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    self.state = UIGestureRecognizerStateCancelled;
    [self reset];
}

@end

#pragma mark ABI42_0_0RNNativeViewgestureHandler

@implementation ABI42_0_0RNNativeViewGestureHandler {
    BOOL _shouldActivateOnStart;
    BOOL _disallowInterruption;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[ABI42_0_0RNDummyGestureRecognizer alloc] init];
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    _shouldActivateOnStart = [ABI42_0_0RCTConvert BOOL:config[@"shouldActivateOnStart"]];
    _disallowInterruption = [ABI42_0_0RCTConvert BOOL:config[@"disallowInterruption"]];
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
    if ([view isKindOfClass:[ABI42_0_0RCTScrollView class]]) {
        // This part of the code is coupled with ABI42_0_0RN implementation of ScrollView native wrapper and
        // we expect for ABI42_0_0RCTScrollView component to contain a subclass of UIScrollview as the only
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

    [self sendEventsInState:ABI42_0_0RNGestureHandlerStateActive
             forViewWithTag:sender.ABI42_0_0ReactTag
              withExtraData:[ABI42_0_0RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleTouchUpOutside:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI42_0_0RNGestureHandlerStateEnd
             forViewWithTag:sender.ABI42_0_0ReactTag
              withExtraData:[ABI42_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
}

- (void)handleTouchUpInside:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI42_0_0RNGestureHandlerStateEnd
             forViewWithTag:sender.ABI42_0_0ReactTag
              withExtraData:[ABI42_0_0RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleDragExit:(UIView *)sender forEvent:(UIEvent *)event
{
    // Pointer is moved outside of the view bounds, we cancel button when `shouldCancelWhenOutside` is set
    if (self.shouldCancelWhenOutside) {
        UIControl *control = (UIControl *)sender;
        [control cancelTrackingWithEvent:event];
        [self sendEventsInState:ABI42_0_0RNGestureHandlerStateEnd
                 forViewWithTag:sender.ABI42_0_0ReactTag
                  withExtraData:[ABI42_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
    } else {
        [self sendEventsInState:ABI42_0_0RNGestureHandlerStateActive
                 forViewWithTag:sender.ABI42_0_0ReactTag
                  withExtraData:[ABI42_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
    }
}

- (void)handleDragEnter:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI42_0_0RNGestureHandlerStateActive
             forViewWithTag:sender.ABI42_0_0ReactTag
              withExtraData:[ABI42_0_0RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleTouchCancel:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI42_0_0RNGestureHandlerStateCancelled
             forViewWithTag:sender.ABI42_0_0ReactTag
              withExtraData:[ABI42_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
}

@end
