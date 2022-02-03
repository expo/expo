#import "ABI44_0_0RNManualHandler.h"

@interface ABI44_0_0RNManualRecognizer : UIGestureRecognizer

- (id)initWithGestureHandler:(ABI44_0_0RNGestureHandler*)gestureHandler;

@end

@implementation ABI44_0_0RNManualRecognizer {
  __weak ABI44_0_0RNGestureHandler *_gestureHandler;
  BOOL _shouldSendBeginEvent;
}

- (id)initWithGestureHandler:(ABI44_0_0RNGestureHandler *)gestureHandler
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

@end

@implementation ABI44_0_0RNManualGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[ABI44_0_0RNManualRecognizer alloc] initWithGestureHandler:self];

    }
    return self;
}

@end
