#import "DevMenuRNManualHandler.h"

@interface DevMenuRNManualRecognizer : UIGestureRecognizer

- (id)initWithGestureHandler:(DevMenuRNGestureHandler*)gestureHandler;

@end

@implementation DevMenuRNManualRecognizer {
  __weak DevMenuRNGestureHandler *_gestureHandler;
  BOOL _shouldSendBeginEvent;
}

- (id)initWithGestureHandler:(DevMenuRNGestureHandler *)gestureHandler
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

@implementation DevMenuRNManualGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[DevMenuRNManualRecognizer alloc] initWithGestureHandler:self];

    }
    return self;
}

@end
