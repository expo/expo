// Copyright 2026-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXLocationMotionActivityLoader : NSObject
@end

@implementation EXLocationMotionActivityLoader

// Swift has no +load. ExpoLocation can restore a saved motion activity task at launch,
// so the provider must be registered before any module code runs.
// The class is looked up by name because a SwiftPM Clang target cannot import the
// generated header of the Swift target it depends on.
+ (void)load
{
  Class registration = NSClassFromString(@"EXLocationMotionActivityRegistration");
  SEL registerProvider = NSSelectorFromString(@"registerProvider");
  if ([registration respondsToSelector:registerProvider]) {
    ((void (*)(id, SEL))[registration methodForSelector:registerProvider])(registration, registerProvider);
  }
}

@end
