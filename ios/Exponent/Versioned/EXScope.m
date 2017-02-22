// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScope.h"

@implementation EXScope

+ (NSString *)moduleName { return @"ExponentScope"; }

@synthesize initialUri = _initialUri;
@synthesize experienceId = _experienceId;

- (instancetype)initWithParams:(NSDictionary *)params
{
  if (self = [super init]) {
    NSDictionary *manifest = params[@"manifest"];
    if (manifest) {
      _experienceId = manifest[@"id"];
    }

    _initialUri = params[@"initialUri"];
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
