

//
//  ABI49_0_0RNPinchHandler.m
//  ABI49_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI49_0_0RNPinchHandler.h"

#if !TARGET_OS_TV
@interface ABI49_0_0RNBetterPinchRecognizer : UIPinchGestureRecognizer

- (id)initWithGestureHandler:(ABI49_0_0RNGestureHandler *)gestureHandler;

@end

@implementation ABI49_0_0RNBetterPinchRecognizer {
  __weak ABI49_0_0RNGestureHandler *_gestureHandler;
}

- (id)initWithGestureHandler:(ABI49_0_0RNGestureHandler *)gestureHandler
{
  if ((self = [super initWithTarget:self action:@selector(handleGesture:)])) {
    _gestureHandler = gestureHandler;
  }
  return self;
}

- (void)handleGesture:(UIGestureRecognizer *)recognizer
{
  if (self.state == UIGestureRecognizerStateBegan) {
    self.scale = 1;
  }
  [_gestureHandler handleGesture:recognizer];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesBegan:touches withEvent:event];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesCancelled:touches withEvent:event];
}

- (void)reset
{
  [_gestureHandler.pointerTracker reset];
  [super reset];
}

@end
#endif

@implementation ABI49_0_0RNPinchGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
  if ((self = [super initWithTag:tag])) {
#if !TARGET_OS_TV
    _recognizer = [[ABI49_0_0RNBetterPinchRecognizer alloc] initWithGestureHandler:self];
#endif
  }
  return self;
}

#if !TARGET_OS_TV
- (ABI49_0_0RNGestureHandlerEventExtraData *)eventExtraData:(UIPinchGestureRecognizer *)recognizer
{
  return [ABI49_0_0RNGestureHandlerEventExtraData forPinch:recognizer.scale
                                   withFocalPoint:[recognizer locationInView:recognizer.view]
                                     withVelocity:recognizer.velocity
                              withNumberOfTouches:recognizer.numberOfTouches];
}
#endif

@end
