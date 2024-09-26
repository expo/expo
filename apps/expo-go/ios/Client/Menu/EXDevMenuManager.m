// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevMenuManager.h"
#import "EXDevMenuWindow.h"
#import "EXHomeModule.h"
#import "EXDevMenuMotionInterceptor.h"
#import "EXDevMenuGestureInterceptor.h"

static NSString *kEXDevMenuMotionGestureEnabled = @"EXDevMenuMotionGestureEnabled";
static NSString *kEXDevMenuTouchGestureEnabled = @"EXDevMenuTouchGestureEnabled";

@interface EXDevMenuManager ()

@property (nonatomic, strong) EXDevMenuWindow *window;

@end

@implementation EXDevMenuManager

+ (instancetype)sharedInstance
{
  static EXDevMenuManager *manager;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!manager) {
      manager = [EXDevMenuManager new];

      // Read initial attributes from user defaults.
      id motionGestureEnabled = [[NSUserDefaults standardUserDefaults] objectForKey:kEXDevMenuMotionGestureEnabled];
      id touchGestureEnabled = [[NSUserDefaults standardUserDefaults] objectForKey:kEXDevMenuTouchGestureEnabled];
      manager.interceptMotionGesture = motionGestureEnabled != nil ? [motionGestureEnabled boolValue] : YES;
      manager.interceptTouchGesture = touchGestureEnabled != nil ? [touchGestureEnabled boolValue] : YES;
    }
  });
  return manager;
}

#pragma mark - API

- (BOOL)interceptMotionGesture
{
  return [EXDevMenuMotionInterceptor isInstalled];
}

- (void)setInterceptMotionGesture:(BOOL)interceptMotionGesture
{
  interceptMotionGesture ? [EXDevMenuMotionInterceptor install] : [EXDevMenuMotionInterceptor uninstall];
  [[NSUserDefaults standardUserDefaults] setBool:interceptMotionGesture forKey:kEXDevMenuMotionGestureEnabled];
}

- (BOOL)interceptTouchGesture
{
  return [EXDevMenuGestureInterceptor isInstalled];
}

- (void)setInterceptTouchGesture:(BOOL)interceptTouchGesture
{
  interceptTouchGesture ? [EXDevMenuGestureInterceptor install] : [EXDevMenuGestureInterceptor uninstall];
  [[NSUserDefaults standardUserDefaults] setBool:interceptTouchGesture forKey:kEXDevMenuTouchGestureEnabled];
}

- (RCTBridge *)mainBridge
{
  return [_delegate mainBridgeForDevMenuManager:self];
}

- (id)mainReactHost {
  return [_delegate mainHostForDevMenuManager:self];
}

- (RCTAppDelegate *)mainAppDelegate
{
  return [_delegate appDelegateForDevMenuManager:self];
}

- (BOOL)isVisible
{
  return _window ? !_window.hidden : NO;
}

- (BOOL)open
{
  if (![self canChangeVisibility:YES]) {
    return NO;
  }
  [self setVisibility:YES];
  return YES;
}

- (BOOL)close
{
  if (![self canChangeVisibility:NO]) {
    return NO;
  }
  EXHomeModule *homeModule = [[[self mainReactHost] moduleRegistry] moduleForName:"ExponentKernel"];

  if (homeModule) {
    // This will trigger `closeWithoutAnimation` once the animation is finished.
    [homeModule requestToCloseDevMenu];
  } else {
    // Module not found, close immediately?
    [self closeWithoutAnimation];
  }

  return YES;
}

- (BOOL)toggle
{
  return self.isVisible ? [self close] : [self open];
}

- (void)closeWithoutAnimation
{
  [self setVisibility:NO];
}

#pragma mark - delegate stubs

- (BOOL)canChangeVisibility:(BOOL)visible
{
  if (self.isVisible == visible) {
    return NO;
  }
  if ([_delegate respondsToSelector:@selector(devMenuManager:canChangeVisibility:)]) {
    return [_delegate devMenuManager:self canChangeVisibility:visible];
  }
  return YES;
}

#pragma mark - internal

- (void)setVisibility:(BOOL)visible
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!self->_window) {
      self->_window = [EXDevMenuWindow new];
    }
    if (visible) {
      [self->_window makeKeyAndVisible];
    } else {
      self->_window.hidden = YES;
    }
  });
}

@end
