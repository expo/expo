// Copyright © 2015 650 Industries. All rights reserved.

#import "EDUMSingletonModule.h"

@implementation EDUMSingletonModule

+ (const NSString *)name
{
  NSAssert(NO, @"[EDUMSingletonModule name] method not implemented, you must override it in subclasses.");
  return nil;
}

- (const NSInteger)priority
{
  return 0;
}

@end
