#import "ABI44_0_0RNFlingHandler.h"

@interface ABI44_0_0RNBetterSwipeGestureRecognizer : UISwipeGestureRecognizer

- (id)initWithGestureHandler:(ABI44_0_0RNGestureHandler*)gestureHandler;

@end

@implementation ABI44_0_0RNBetterSwipeGestureRecognizer {
  __weak ABI44_0_0RNGestureHandler* _gestureHandler;
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
  [_gestureHandler reset];
  [self triggerAction];
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

- (void)triggerAction
{
  [_gestureHandler handleGesture:self];
}

- (void)reset
{
  [self triggerAction];
  [_gestureHandler.pointerTracker reset];
  [super reset];
}

@end

@implementation ABI44_0_0RNFlingGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
  if ((self = [super initWithTag:tag])) {
    _recognizer = [[ABI44_0_0RNBetterSwipeGestureRecognizer alloc] initWithGestureHandler:self];
  }
  return self;
}
- (void)resetConfig
{
  [super resetConfig];
  UISwipeGestureRecognizer *recognizer = (UISwipeGestureRecognizer *)_recognizer;
  recognizer.direction = UISwipeGestureRecognizerDirectionRight;
  recognizer.numberOfTouchesRequired = 1;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    UISwipeGestureRecognizer *recognizer = (UISwipeGestureRecognizer *)_recognizer;

    id prop = config[@"direction"];
    if (prop != nil) {
        recognizer.direction = [ABI44_0_0RCTConvert NSInteger:prop];
    }
    
#if !TARGET_OS_TV
    prop = config[@"numberOfPointers"];
    if (prop != nil) {
        recognizer.numberOfTouchesRequired = [ABI44_0_0RCTConvert NSInteger:prop];
    }
#endif
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
    ABI44_0_0RNGestureHandlerState savedState = _lastState;
    BOOL shouldBegin = [super gestureRecognizerShouldBegin:gestureRecognizer];
    _lastState = savedState;
    
    return shouldBegin;
}

@end

