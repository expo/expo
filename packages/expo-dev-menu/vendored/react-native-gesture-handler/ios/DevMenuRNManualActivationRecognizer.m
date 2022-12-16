#import "DevMenuRNManualActivationRecognizer.h"
#import "DevMenuRNGestureHandler.h"

@implementation DevMenuRNManualActivationRecognizer {
  DevMenuRNGestureHandler *_handler;
  int _activePointers;
}

- (id)initWithGestureHandler:(DevMenuRNGestureHandler *)gestureHandler
{
  if ((self = [super initWithTarget:self action:nil])) {
    _handler = gestureHandler;
    self.delegate = self;
    _activePointers = 0;
  }
  return self;
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];

  _activePointers += touches.count;
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  
  _activePointers -= touches.count;
  
  if (_activePointers == 0) {
    [self fail];
    [self reset];
  }
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  
  _activePointers = 0;
  [self reset];
}

- (void)reset
{
  self.enabled = YES;
  [super reset];
}

- (void)fail
{
  self.enabled = NO;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  return YES;
}

- (BOOL)shouldBeRequiredToFailByGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  DevMenuRNGestureHandler *handler = [DevMenuRNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
  if (handler != nil) {
    if (handler.tag == _handler.tag) {
      return YES;
    }
  }
  
  return NO;
}

@end
