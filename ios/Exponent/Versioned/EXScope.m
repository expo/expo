// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScope.h"

@implementation EXScope

// NOTE(ben): Use a more obscure name here to avoid confusion if one looks in `NativeModules` in JS?
+ (NSString *)moduleName { return @"ExponentScope"; }

@end

@implementation  RCTBridge (EXScope)

- (EXScope *)exScope
{
  return [self moduleForClass:[EXScope class]];
}

@end
