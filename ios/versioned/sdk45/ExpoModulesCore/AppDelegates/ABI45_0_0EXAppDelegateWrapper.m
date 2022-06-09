// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXAppDelegateWrapper.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXReactDelegateWrapper+Private.h>
#import <ABI45_0_0ExpoModulesCore/Swift.h>


@interface ABI45_0_0EXAppDelegateWrapper()

@property (nonatomic, strong) ABI45_0_0EXReactDelegateWrapper *reactDelegate;

@end

@implementation ABI45_0_0EXAppDelegateWrapper {
  ABI45_0_0EXExpoAppDelegate *_expoAppDelegate;
}

// Synthesize window, so the AppDelegate can synthesize it too.
@synthesize window = _window;

- (instancetype)init
{
  if (self = [super init]) {
    _expoAppDelegate = [[ABI45_0_0EXExpoAppDelegate alloc] init];
    _reactDelegate = [[ABI45_0_0EXReactDelegateWrapper alloc] initWithExpoReactDelegate:_expoAppDelegate.reactDelegate];
  }
  return self;
}

// This needs to be implemented, otherwise forwarding won't be called.
// When the app starts, `UIApplication` uses it to check beforehand
// which `UIApplicationDelegate` selectors are implemented.
- (BOOL)respondsToSelector:(SEL)selector
{
  return [super respondsToSelector:selector]
    || [_expoAppDelegate respondsToSelector:selector];
}

// Forwards all invocations to `ExpoAppDelegate` object.
- (id)forwardingTargetForSelector:(SEL)selector
{
  return _expoAppDelegate;
}

@end
