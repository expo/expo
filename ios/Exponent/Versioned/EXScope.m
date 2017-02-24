// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScope.h"
#import "EXVersionManager.h"

@implementation EXScope

+ (NSString *)moduleName { return @"ExponentScope"; }

@synthesize initialUri = _initialUri;
@synthesize experienceId = _experienceId;
@synthesize documentDirectory = _documentDirectory;
@synthesize cachesDirectory = _cachesDirectory;

- (instancetype)initWithParams:(NSDictionary *)params
{
  if (self = [super init]) {
    NSDictionary *manifest = params[@"manifest"];
    assert(manifest);
    _experienceId = manifest[@"id"];

    NSString *subdir = [EXVersionManager escapedResourceName:_experienceId];
    _documentDirectory = [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject
                           stringByAppendingPathComponent:@"ExponentExperienceData"]
                          stringByAppendingPathComponent:subdir];
    _cachesDirectory = [[NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject
                         stringByAppendingPathComponent:@"ExponentExperienceData"]
                        stringByAppendingPathComponent:subdir];

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
