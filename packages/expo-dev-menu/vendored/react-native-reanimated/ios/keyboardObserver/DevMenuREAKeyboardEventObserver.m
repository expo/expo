#import "DevMenuREAKeyboardEventObserver.h"
#import <Foundation/Foundation.h>
#import <React/RCTDefines.h>
#import <React/RCTUIManager.h>

typedef NS_ENUM(NSUInteger, KeyboardState) {
  UNKNOWN = 0,
  OPENING = 1,
  OPEN = 2,
  CLOSING = 3,
  CLOSED = 4,
};

@implementation DevMenuREAKeyboardEventObserver {
  NSNumber *_nextListenerId;
  NSMutableDictionary *_listeners;
  CADisplayLink *displayLink;
  int _windowsCount;
  UIView *_keyboardView;
  KeyboardState _state;
}

- (instancetype)init
{
  self = [super init];
  _listeners = [[NSMutableDictionary alloc] init];
  _nextListenerId = @0;
  _state = UNKNOWN;
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
  displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateKeyboardFrame)];
  [displayLink addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)stopAnimation
{
  [displayLink invalidate];
  displayLink = nil;
  [self updateKeyboardFrame];
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
  if ([_listeners count] == 0) {
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

  [_listeners setObject:listener forKey:listenerId];
  if (_state == UNKNOWN) {
    [self recognizeInitialKeyboardState];
  }
  return [listenerId intValue];
}

- (void)unsubscribeFromKeyboardEvents:(int)listenerId
{
  NSNumber *_listenerId = [NSNumber numberWithInt:listenerId];
  [_listeners removeObjectForKey:_listenerId];
  if ([_listeners count] == 0) {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
  }
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

#endif

@end
