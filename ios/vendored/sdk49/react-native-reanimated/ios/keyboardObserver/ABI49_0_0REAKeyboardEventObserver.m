#import <Foundation/Foundation.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REAKeyboardEventObserver.h>
#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>

typedef NS_ENUM(NSUInteger, KeyboardState) {
  UNKNOWN = 0,
  OPENING = 1,
  OPEN = 2,
  CLOSING = 3,
  CLOSED = 4,
};

@implementation ABI49_0_0REAKeyboardEventObserver {
  UIView *_measuringView;
  NSNumber *_nextListenerId;
  NSMutableDictionary *_listeners;
  CADisplayLink *_displayLink;
  KeyboardState _state;
}

- (instancetype)init
{
  self = [super init];
  _listeners = [[NSMutableDictionary alloc] init];
  _nextListenerId = @0;
  _state = UNKNOWN;

  NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];

  [notificationCenter addObserver:self
                         selector:@selector(cleanupListeners)
                             name:ABI49_0_0RCTBridgeDidInvalidateModulesNotification
                           object:nil];
  return self;
}

#if TARGET_OS_TV
- (int)subscribeForKeyboardEvents:(KeyboardEventListenerBlock)listener
{
  NSLog(@"Keyboard handling is not supported on tvOS");
  return 0;
}

- (void)unsubscribeFromKeyboardEvents:(int)listenerId
{
  NSLog(@"Keyboard handling is not supported on tvOS");
}
#else

- (void)runUpdater
{
  if (!_displayLink) {
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateKeyboardFrame)];
    _displayLink.preferredFramesPerSecond = 120; // will fallback to 60 fps for devices without Pro Motion display
    [_displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
  _displayLink.paused = NO;
  [self updateKeyboardFrame];
}

- (void)updateKeyboardFrame
{
  BOOL isAnimatingKeyboardChange = _measuringView.layer.presentationLayer.animationKeys.count != 0;
  CGRect measuringFrame =
      isAnimatingKeyboardChange ? _measuringView.layer.presentationLayer.frame : _measuringView.frame;
  CGFloat keyboardHeight = measuringFrame.size.height;

  if (!isAnimatingKeyboardChange) {
    // measuring view is no longer running an animation, we should settle in OPEN/CLOSE state
    if (_state == OPENING || _state == CLOSING) {
      _state = _state == OPENING ? OPEN : CLOSED;
    }
    // stop display link updates if no animation is running
    _displayLink.paused = YES;
  }

  for (NSString *key in _listeners.allKeys) {
    ((KeyboardEventListenerBlock)_listeners[key])(_state, keyboardHeight);
  }
}

- (void)keyboardWillChangeFrame:(NSNotification *)notification
{
  NSDictionary *userInfo = [notification userInfo];
  CGRect beginFrame = [[userInfo objectForKey:UIKeyboardFrameBeginUserInfoKey] CGRectValue];
  CGRect endFrame = [[userInfo objectForKey:UIKeyboardFrameEndUserInfoKey] CGRectValue];
  NSTimeInterval animationDuration = [[userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey] doubleValue];
  CGSize windowSize = [[[UIApplication sharedApplication] delegate] window].frame.size;

  CGFloat beginHeight = windowSize.height - beginFrame.origin.y;
  CGFloat endHeight = windowSize.height - endFrame.origin.y;

  if (endHeight > 0 && _state != OPEN) {
    _state = OPENING;
  } else if (endHeight == 0 && _state != CLOSED) {
    _state = CLOSING;
  }

  _measuringView.frame = CGRectMake(0, -1, 0, beginHeight);
  [UIView animateWithDuration:animationDuration
                   animations:^{
                     self->_measuringView.frame = CGRectMake(0, -1, 0, endHeight);
                   }];
  [self runUpdater];
}

- (int)subscribeForKeyboardEvents:(KeyboardEventListenerBlock)listener
{
  NSNumber *listenerId = [_nextListenerId copy];
  _nextListenerId = [NSNumber numberWithInt:[_nextListenerId intValue] + 1];
  ABI49_0_0RCTExecuteOnMainQueue(^() {
    if (!self->_measuringView) {
      self->_measuringView = [[UIView alloc] initWithFrame:CGRectMake(0, -1, 0, 0)];
      UIWindow *keyWindow = [[[UIApplication sharedApplication] delegate] window];
      [keyWindow addSubview:self->_measuringView];
    }
    if ([self->_listeners count] == 0) {
      NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];

      [notificationCenter addObserver:self
                             selector:@selector(keyboardWillChangeFrame:)
                                 name:UIKeyboardWillChangeFrameNotification
                               object:nil];
    }

    [self->_listeners setObject:listener forKey:listenerId];
  });
  return [listenerId intValue];
}

- (void)unsubscribeFromKeyboardEvents:(int)listenerId
{
  ABI49_0_0RCTExecuteOnMainQueue(^() {
    NSNumber *_listenerId = [NSNumber numberWithInt:listenerId];
    [self->_listeners removeObjectForKey:_listenerId];
    if ([self->_listeners count] == 0) {
      [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillChangeFrameNotification object:nil];
    }
  });
}

- (void)cleanupListeners
{
  ABI49_0_0RCTUnsafeExecuteOnMainQueueSync(^() {
    [self->_listeners removeAllObjects];
    [self->_displayLink invalidate];
    self->_displayLink = nil;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  });
}

#endif

@end
