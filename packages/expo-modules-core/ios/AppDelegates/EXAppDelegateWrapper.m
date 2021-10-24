// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppDelegateWrapper.h>

#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
// When `use_frameworks!` is used, the generated Swift header is inside ExpoModulesCore module.
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#else
#import "ExpoModulesCore-Swift.h"
#endif

@implementation EXAppDelegateWrapper {
  EXSwiftAppDelegateWrapper *_swiftAppDelegate;
}

@synthesize window = _window;

- (instancetype)init
{
  if (self = [super init]) {
    _swiftAppDelegate = [[EXSwiftAppDelegateWrapper alloc] init];
  }
  return self;
}

- (void)forwardInvocation:(NSInvocation *)invocation
{
  SEL selector = [invocation selector];

  if ([_swiftAppDelegate respondsToSelector:selector]) {
    [invocation invokeWithTarget:_swiftAppDelegate];
  } else {
    [super forwardInvocation:invocation];
  }
}

@end
