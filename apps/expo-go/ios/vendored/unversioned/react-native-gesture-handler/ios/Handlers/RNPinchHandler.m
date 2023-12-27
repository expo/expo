

//
//  RNPinchHandler.m
//  RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "RNPinchHandler.h"

#if !TARGET_OS_TV
@interface RNBetterPinchRecognizer : UIPinchGestureRecognizer

- (id)initWithGestureHandler:(RNGestureHandler *)gestureHandler;

@end

@implementation RNBetterPinchRecognizer {
  __weak RNGestureHandler *_gestureHandler;
}

- (id)initWithGestureHandler:(RNGestureHandler *)gestureHandler
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

@implementation RNPinchGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
  if ((self = [super initWithTag:tag])) {
#if !TARGET_OS_TV
    _recognizer = [[RNBetterPinchRecognizer alloc] initWithGestureHandler:self];
#endif
  }
  return self;
}

#if !TARGET_OS_TV
- (RNGestureHandlerEventExtraData *)eventExtraData:(UIPinchGestureRecognizer *)recognizer
{
  return [RNGestureHandlerEventExtraData forPinch:recognizer.scale
                                   withFocalPoint:[recognizer locationInView:recognizer.view]
                                     withVelocity:recognizer.velocity
                              withNumberOfTouches:recognizer.numberOfTouches];
}
#endif

@end
