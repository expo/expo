#import "ABI47_0_0RNManualHandler.h"

@interface ABI47_0_0RNManualRecognizer : UIGestureRecognizer

- (id)initWithGestureHandler:(ABI47_0_0RNGestureHandler *)gestureHandler;

@end

@implementation ABI47_0_0RNManualRecognizer {
  __weak ABI47_0_0RNGestureHandler *_gestureHandler;
  BOOL _shouldSendBeginEvent;
}

- (id)initWithGestureHandler:(ABI47_0_0RNGestureHandler *)gestureHandler
{
  if ((self = [super initWithTarget:gestureHandler action:@selector(handleGesture:)])) {
    _gestureHandler = gestureHandler;
    _shouldSendBeginEvent = YES;
  }
  return self;
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesBegan:touches withEvent:event];

  if (_shouldSendBeginEvent) {
    [_gestureHandler handleGesture:self];
    _shouldSendBeginEvent = NO;
  }
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesMoved:touches withEvent:event];

  if ([self shouldFail]) {
    self.state = (self.state == UIGestureRecognizerStatePossible)
      ? UIGestureRecognizerStateFailed
      : UIGestureRecognizerStateCancelled;

    [self reset];
  }
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

  _shouldSendBeginEvent = YES;
}

- (BOOL)shouldFail
{
  if (_gestureHandler.shouldCancelWhenOutside && ![_gestureHandler containsPointInView]) {
    return YES;
  } else {
    return NO;
  }
}

@end

@implementation ABI47_0_0RNManualGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
  if ((self = [super initWithTag:tag])) {
    _recognizer = [[ABI47_0_0RNManualRecognizer alloc] initWithGestureHandler:self];
  }
  return self;
}

@end
