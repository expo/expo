// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppDelegateWrapper.h>
#import <ExpoModulesCore/EXReactDelegateWrapper+Private.h>
#import <ExpoModulesCore/Swift.h>


@interface EXAppDelegateWrapper()

@property (nonatomic, strong) EXReactDelegateWrapper *reactDelegate;

@end

@implementation EXAppDelegateWrapper {
  EXExpoAppDelegate *_expoAppDelegate;
}

// Synthesize window, so the AppDelegate can synthesize it too.
@synthesize window = _window;

- (instancetype)init
{
  if (self = [super init]) {
    _expoAppDelegate = [[EXExpoAppDelegate alloc] init];
    _reactDelegate = [[EXReactDelegateWrapper alloc] initWithExpoReactDelegate:_expoAppDelegate.reactDelegate];
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
