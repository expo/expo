// Copyright © 2015 650 Industries. All rights reserved.

#import "UMSingletonModule.h"

@implementation UMSingletonModule

+ (const NSString *)name
{
  NSAssert(NO, @"[UMSingletonModule name] method not implemented, you must override it in subclasses.");
  return nil;
}

- (const NSInteger)priority
{
  return 0;
}

@end
