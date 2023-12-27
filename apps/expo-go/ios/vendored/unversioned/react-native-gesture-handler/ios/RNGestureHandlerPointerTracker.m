#import "RNGestureHandlerPointerTracker.h"
#import "RNGestureHandler.h"

#import <React/UIView+React.h>

@implementation RNGestureHandlerPointerTracker {
  __weak RNGestureHandler *_gestureHandler;
  UITouch *_trackedPointers[MAX_POINTERS_COUNT];
  int _trackedPointersCount;
}

- (id)initWithGestureHandler:(id)gestureHandler
{
  _gestureHandler = gestureHandler;
  _trackedPointersCount = 0;
  _changedPointersData = nil;
  _allPointersData = nil;

  for (int i = 0; i < MAX_POINTERS_COUNT; i++) {
    _trackedPointers[i] = nil;
  }

  return self;
}

- (int)registerTouch:(UITouch *)touch
{
  for (int index = 0; index < MAX_POINTERS_COUNT; index++) {
    if (_trackedPointers[index] == nil) {
      _trackedPointers[index] = touch;
      return index;
    }
  }

  return -1;
}

- (int)unregisterTouch:(UITouch *)touch
{
  for (int index = 0; index < MAX_POINTERS_COUNT; index++) {
    if (_trackedPointers[index] == touch) {
      _trackedPointers[index] = nil;
      return index;
    }
  }

  return -1;
}

- (int)findTouchIndex:(UITouch *)touch
{
  for (int index = 0; index < MAX_POINTERS_COUNT; index++) {
    if (_trackedPointers[index] == touch) {
      return index;
    }
  }
  return -1;
}

- (int)registeredTouchesCount
{
  int count = 0;
  for (int i = 0; i < MAX_POINTERS_COUNT; i++) {
    if (_trackedPointers[i] != nil) {
      count++;
    }
  }
  return count;
}

- (NSDictionary *)extractPointerData:(int)index forTouch:(UITouch *)touch
{
  CGPoint relativePos = [touch locationInView:_gestureHandler.recognizer.view];
  CGPoint absolutePos = [touch locationInView:_gestureHandler.recognizer.view.window];

  return @{
    @"id" : @(index),
    @"x" : @(relativePos.x),
    @"y" : @(relativePos.y),
    @"absoluteX" : @(absolutePos.x),
    @"absoluteY" : @(absolutePos.y)
  };
}

- (void)extractAllTouches
{
  int registeredTouches = [self registeredTouchesCount];

  NSDictionary *data[registeredTouches];
  int nextIndex = 0;

  for (int i = 0; i < MAX_POINTERS_COUNT; i++) {
    UITouch *touch = _trackedPointers[i];
    if (touch != nil) {
      data[nextIndex++] = [self extractPointerData:i forTouch:touch];
    }
  }

  _allPointersData = [[NSArray alloc] initWithObjects:data count:registeredTouches];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  if (!_gestureHandler.needsPointerData) {
    return;
  }

  _eventType = RNGHTouchEventTypePointerDown;

  NSDictionary *data[touches.count];

  for (int i = 0; i < [touches count]; i++) {
    UITouch *touch = [[touches allObjects] objectAtIndex:i];
    int index = [self registerTouch:touch];
    if (index >= 0) {
      _trackedPointersCount++;
    }

    data[i] = [self extractPointerData:index forTouch:touch];
  }

  _changedPointersData = [[NSArray alloc] initWithObjects:data count:[touches count]];
  // extract all touches last to include the ones that were just added
  [self extractAllTouches];
  [self sendEvent];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  if (!_gestureHandler.needsPointerData) {
    return;
  }

  _eventType = RNGHTouchEventTypePointerMove;

  NSDictionary *data[touches.count];

  for (int i = 0; i < [touches count]; i++) {
    UITouch *touch = [[touches allObjects] objectAtIndex:i];
    int index = [self findTouchIndex:touch];
    data[i] = [self extractPointerData:index forTouch:touch];
  }

  _changedPointersData = [[NSArray alloc] initWithObjects:data count:[touches count]];
  [self extractAllTouches];
  [self sendEvent];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  if (!_gestureHandler.needsPointerData) {
    return;
  }

  // extract all touches first to include the ones that were just lifted
  [self extractAllTouches];

  _eventType = RNGHTouchEventTypePointerUp;

  NSDictionary *data[touches.count];

  for (int i = 0; i < [touches count]; i++) {
    UITouch *touch = [[touches allObjects] objectAtIndex:i];
    int index = [self unregisterTouch:touch];
    if (index >= 0) {
      _trackedPointersCount--;
    }

    data[i] = [self extractPointerData:index forTouch:touch];
  }

  _changedPointersData = [[NSArray alloc] initWithObjects:data count:[touches count]];
  [self sendEvent];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  if (!_gestureHandler.needsPointerData) {
    return;
  }

  [self reset];
}

- (void)reset
{
  if (!_gestureHandler.needsPointerData) {
    return;
  }

  if (_trackedPointersCount == 0) {
    // gesture has finished because all pointers were lifted, reset event type to send state change event
    _eventType = RNGHTouchEventTypeUndetermined;
  } else {
    // turns out that the gesture may be made to fail without calling touchesCancelled in that case there
    // are still tracked pointers but the recognizer state is already set to UIGestureRecognizerStateFailed
    // we need to clear the pointers and send info about their cancellation
    [self cancelPointers];
  }

  [_gestureHandler reset];
}

- (void)cancelPointers
{
  // extract all touches first to include the ones that were just cancelled
  [self extractAllTouches];

  int registeredTouches = [self registeredTouchesCount];

  if (registeredTouches > 0) {
    int nextIndex = 0;
    NSDictionary *data[registeredTouches];

    for (int i = 0; i < MAX_POINTERS_COUNT; i++) {
      UITouch *touch = _trackedPointers[i];
      if (touch != nil) {
        data[nextIndex++] = [self extractPointerData:i forTouch:touch];
        [self unregisterTouch:touch];
      }
    }

    _eventType = RNGHTouchEventTypeCancelled;
    _changedPointersData = [[NSArray alloc] initWithObjects:data count:registeredTouches];
    [self sendEvent];
    _trackedPointersCount = 0;
  }
}

- (void)sendEvent
{
  // it may happen that the gesture recognizer is reset after it's been unbound from the view,
  // it that recognizer tried to send event, the app would crash because the target of the event
  // would be nil.
  if (!_gestureHandler.needsPointerData || _gestureHandler.recognizer.view.reactTag == nil) {
    return;
  }

  [_gestureHandler sendTouchEventInState:[_gestureHandler state]
                          forViewWithTag:_gestureHandler.recognizer.view.reactTag];
}

@end
