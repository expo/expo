// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScope.h"

@implementation EXScope

+ (NSString *)moduleName { return @"ExponentScope"; }

- (instancetype)initWithParams:(NSDictionary *)params
{
  if (self = [super init]) {
    self.initialUri = params[@"initialUri"];
    self.experienceId = params[@"manifest"][@"id"];
  }
  return self;
}

@end

@implementation  RCTBridge (EXScope)

- (EXScope *)experienceScope
{
  return [self moduleForClass:[EXScope class]];
}

@end
