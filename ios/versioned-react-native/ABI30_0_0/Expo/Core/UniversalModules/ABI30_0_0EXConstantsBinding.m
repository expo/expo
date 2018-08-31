// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXConstantsBinding.h"
#import "ABI30_0_0EXUnversioned.h"

@interface ABI30_0_0EXConstantsBinding ()

@property (nonatomic, strong) NSDictionary *unversionedConstants;

@end

@implementation ABI30_0_0EXConstantsBinding : ABI30_0_0EXConstantsService

@synthesize appOwnership = _appOwnership;

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId]) {
    _unversionedConstants = params[@"constants"];
    if (_unversionedConstants && _unversionedConstants[@"appOwnership"]) {
      _appOwnership = _unversionedConstants[@"appOwnership"];
    }
  }
  return self;
}

- (NSDictionary *)constants
{
  NSMutableDictionary *constants = [[super constants] mutableCopy];
  
  [constants setValue:[self expoClientVersion] forKey:@"expoVersion"];
  
  if (_unversionedConstants) {
    [constants addEntriesFromDictionary:_unversionedConstants];
  }
  return constants;
}

- (NSString *)expoClientVersion
{
  NSString *expoClientVersion = _unversionedConstants[@"expoRuntimeVersion"];
  if (expoClientVersion) {
    return expoClientVersion;
  } else {
    // not correct in standalone apps
    return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"];
  }
}

@end
