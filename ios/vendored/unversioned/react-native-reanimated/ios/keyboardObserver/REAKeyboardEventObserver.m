#import <Foundation/Foundation.h>
#import <RNReanimated/REAKeyboardEventObserver.h>
#import <React/RCTDefines.h>
#import <React/RCTUIManager.h>

typedef NS_ENUM(NSUInteger, KeyboardState) {
  UNKNOWN = 0,
  OPENING = 1,
  OPEN = 2,
  CLOSING = 3,
  CLOSED = 4,
};

@implementation REAKeyboardEventObserver {
  NSNumber *_nextListenerId;
  NSMutableDictionary *_listeners;
  CADisplayLink *displayLink;
  int _windowsCount;
  UIView *_keyboardView;
  KeyboardState _state;
  bool _shouldInvalidateDisplayLink;
}

- (instancetype)init
{
  self = [super init];
  _listeners = [[NSMutableDictionary alloc] init];
  _nextListenerId = @0;
  _state = UNKNOWN;
  _shouldInvalidateDisplayLink = false;

  NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];

  [notificationCenter addObserver:self
                         selector:@selector(clearListeners)
                             name:RCTBridgeDidInvalidateModulesNotification
                           object:nil];
  return self;
}

// copied from
// https://github.com/tonlabs/UIKit/blob/bd5651e4723d547bde0cb86ca1c27813cedab4a9/casts/keyboard/ios/UIKitKeyboardIosFrameListener.m
- (UIView *)findKeyboardView
{
  for (UIWindow *window in [UIApplication.sharedApplication.windows objectEnumerator]) {
    if ([window isKindOfClass:NSClassFromString(@"UITextEffectsWindow")]) {
      for (UIView *containerView in window.subviews) {
        if ([containerView isKindOfClass:NSClassFromString(@"UIInputSetContainerView")]) {
          for (UIView *hostView in containerView.subviews) {
            if ([hostView isKindOfClass:NSClassFromString(@"UIInputSetHostView")]) {
              return hostView;
            }
          }
        }
      }
    }
  }
  return nil;
}

- (UIView *)getKeyboardView
{
  /**
   * If the count of windows has changed it means there might be a new UITextEffectsWindow,
   * thus we have to obtain a new `keyboardView`
   */
  int windowsCount = [UIApplication.sharedApplication.windows count];

  if (_keyboardView == nil || windowsCount != _windowsCount) {
    _keyboardView = [self findKeyboardView];
    _windowsCount = windowsCount;
  }
  return _keyboardView;
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

- (void)runAnimation
{
  if (!displayLink) {
    displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateKeyboardFrame)];
    [displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
  }
}

- (void)stopAnimation
{
  [self updateKeyboardFrame];
  // there might be a case that keyboard will change height in the next frame
  // (for example changing keyboard language so that suggestions appear)
  // so we invalidate display link after we handle that in the next frame
  _shouldInvalidateDisplayLink = true;
}

- (void)updateKeyboardFrame
{
  UIView *keyboardView = [self getKeyboardView];
  if (keyboardView == nil) {
    return;
  }

  CGFloat keyboardHeight = [self computeKeyboardHeight:keyboardView];
  for (NSString *key in _listeners.allKeys) {
    ((KeyboardEventListenerBlock)_listeners[key])(_state, keyboardHeight);
  }

  if (_shouldInvalidateDisplayLink) {
    _shouldInvalidateDisplayLink = false;
    [displayLink invalidate];
    displayLink = nil;
  }
}

- (CGFloat)computeKeyboardHeight:(UIView *)keyboardView
{
  CGFloat keyboardFrameY = [keyboardView.layer presentationLayer].frame.origin.y;
  CGFloat keyboardWindowH = keyboardView.window.bounds.size.height;
  CGFloat keyboardHeight = keyboardWindowH - keyboardFrameY;
  return keyboardHeight;
}

- (void)keyboardWillShow:(NSNotification *)notification
{
  _state = OPENING;
  [self runAnimation];
}

- (void)keyboardDidShow:(NSNotification *)notification
{
  _state = OPEN;
  [self stopAnimation];
}

- (void)keyboardWillHide:(NSNotification *)notification
{
  _state = CLOSING;
  [self runAnimation];
}

- (void)keyboardDidHide:(NSNotification *)notification
{
  _state = CLOSED;
  [self stopAnimation];
}

- (int)subscribeForKeyboardEvents:(KeyboardEventListenerBlock)listener
{
  NSNumber *listenerId = [_nextListenerId copy];
  _nextListenerId = [NSNumber numberWithInt:[_nextListenerId intValue] + 1];
  RCTExecuteOnMainQueue(^() {
    if ([self->_listeners count] == 0) {
      NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];

      [notificationCenter addObserver:self
                             selector:@selector(keyboardWillHide:)
                                 name:UIKeyboardWillHideNotification
                               object:nil];

      [notificationCenter addObserver:self
                             selector:@selector(keyboardWillShow:)
                                 name:UIKeyboardWillShowNotification
                               object:nil];

      [notificationCenter addObserver:self
                             selector:@selector(keyboardDidHide:)
                                 name:UIKeyboardDidHideNotification
                               object:nil];

      [notificationCenter addObserver:self
                             selector:@selector(keyboardDidShow:)
                                 name:UIKeyboardDidShowNotification
                               object:nil];
    }

    [self->_listeners setObject:listener forKey:listenerId];
    if (self->_state == UNKNOWN) {
      [self recognizeInitialKeyboardState];
    }
  });
  return [listenerId intValue];
}

- (void)unsubscribeFromKeyboardEvents:(int)listenerId
{
  RCTExecuteOnMainQueue(^() {
    NSNumber *_listenerId = [NSNumber numberWithInt:listenerId];
    [self->_listeners removeObjectForKey:_listenerId];
    if ([self->_listeners count] == 0) {
      [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
      [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
      [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardDidHideNotification object:nil];
      [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardDidShowNotification object:nil];
    }
  });
}

- (void)recognizeInitialKeyboardState
{
  RCTExecuteOnMainQueue(^() {
    UIView *keyboardView = [self getKeyboardView];
    if (keyboardView == nil) {
      self->_state = CLOSED;
    } else {
      CGFloat keyboardHeight = [self computeKeyboardHeight:keyboardView];
      self->_state = keyboardHeight == 0 ? CLOSED : OPEN;
    }
    [self updateKeyboardFrame];
  });
}

- (void)clearListeners
{
  RCTUnsafeExecuteOnMainQueueSync(^() {
    [self->_listeners removeAllObjects];
    [self->displayLink invalidate];
    self->displayLink = nil;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  });
}

#endif

@end
