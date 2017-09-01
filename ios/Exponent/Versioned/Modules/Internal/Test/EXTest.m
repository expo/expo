// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXTest.h"

@implementation EXTest

+ (NSString *)moduleName { return @"ExponentTest"; }

RCT_EXPORT_METHOD(completed: (NSString *)jsonStringifiedResult)
{
  // TODO
  NSLog(@"completed native");
}

RCT_EXPORT_METHOD(action: (NSDictionary *)params)
{
  // TODO
  NSLog(@"action native");
}

@end
