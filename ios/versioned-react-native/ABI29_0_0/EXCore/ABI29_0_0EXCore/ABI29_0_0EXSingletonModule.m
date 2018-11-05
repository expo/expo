// Copyright © 2015 650 Industries. All rights reserved.

#import "ABI29_0_0EXSingletonModule.h"

static NSMutableDictionary *singletonModules = nil;

@implementation ABI29_0_0EXSingletonModule

+ (nonnull instancetype)sharedInstance
{
  if (singletonModules == nil) {
    singletonModules = [NSMutableDictionary new];
  }

  NSString *className = NSStringFromClass(self);
  id instance = [singletonModules objectForKey:className];

  if (instance == nil) {
    instance = [[self alloc] init];
    [singletonModules setObject:instance forKey:className];
  }

  return instance;
}

+ (NSString *)name
{
  NSAssert(NO, @"[ABI29_0_0EXSingletonModule name] method not implemented, you must override it in subclasses.");
  return nil;
}

@end
