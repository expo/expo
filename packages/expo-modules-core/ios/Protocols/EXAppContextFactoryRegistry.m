// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXAppContextFactoryRegistry.h>

@implementation EXAppContextFactoryRegistry

+ (nullable id<EXAppContextProtocol>)createAppContext {
  // Look up the Swift factory class at runtime
  // The Swift class EXAppContextFactory is exposed to ObjC as
  // "EXAppContextFactory"
  Class factoryClass = NSClassFromString(@"EXAppContextFactory");

  if (factoryClass &&
      [factoryClass respondsToSelector:@selector(createAppContext)]) {
    return [factoryClass createAppContext];
  }

  NSLog(@"[EXAppContextFactoryRegistry] Warning: EXAppContextFactory class not "
        @"found. AppContext cannot be created.");
  return nil;
}

@end
