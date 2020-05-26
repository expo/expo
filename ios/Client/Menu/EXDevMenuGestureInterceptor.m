// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTUtils.h>

#import "EXDevMenuGestureInterceptor.h"
#import "EXDevMenuGestureRecognizer.h"

@import UIKit;

static BOOL isInstalled = NO;
static EXDevMenuGestureRecognizer *gestureRecognizerInstance;

@implementation UIWindow (EXDevMenuGestureInterceptor)

- (NSArray<__kindof UIGestureRecognizer *> *)EX_gestureRecognizers
{
  // Just for thread safety, someone may uninstall the interceptor in the meantime and we would fall into recursive loop.
  if (!isInstalled) {
    return [self gestureRecognizers];
  }

  // Check for the case where singleton instance of gesture recognizer is not created yet or is attached to different window.
  if (!gestureRecognizerInstance || gestureRecognizerInstance.view != self) {
    // Create gesture recognizer if not created yet.
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      gestureRecognizerInstance = [EXDevMenuGestureRecognizer new];
    });

    // Remove it from the window it's attached to.
    [gestureRecognizerInstance.view removeGestureRecognizer:gestureRecognizerInstance];

    // Attach to this window.
    [self addGestureRecognizer:gestureRecognizerInstance];
  }

  // `EX_gestureRecognizers` implementation has been swapped with `gestureRecognizers` - it might be confusing that we call it recursively, but we don't.
  return [self EX_gestureRecognizers];
}

@end

@implementation EXDevMenuGestureInterceptor

+ (void)install
{
  if (!isInstalled) {
    // Capture touch gesture from any window by swapping default implementation from UIWindow.
    RCTSwapInstanceMethods([UIWindow class], @selector(gestureRecognizers), @selector(EX_gestureRecognizers));
    isInstalled = YES;

    // Make sure gesture recognizer is enabled.
    [gestureRecognizerInstance setEnabled:YES];
  }
}

+ (void)uninstall
{
  if (isInstalled) {
    // Bring back the original method.
    RCTSwapInstanceMethods([UIWindow class], @selector(gestureRecognizers), @selector(EX_gestureRecognizers));
    isInstalled = NO;

    // Cancel recognized gestures and disable it entirely.
    [gestureRecognizerInstance setEnabled:NO];
  }
}

+ (BOOL)isInstalled
{
  return isInstalled;
}

@end
