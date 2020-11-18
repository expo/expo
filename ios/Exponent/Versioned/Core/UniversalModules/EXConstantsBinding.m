// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXConstantsBinding.h"
#import "EXUnversioned.h"

@interface EXConstantsBinding ()

@property (nonatomic, strong) NSString *appOwnership;
@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, strong) NSDictionary *unversionedConstants;

@end

@implementation EXConstantsBinding : EXConstantsService

- (instancetype)initWithExperienceId:(NSString *)experienceId andParams:(NSDictionary *)params
{
  if (self = [super init]) {
    _experienceId = experienceId;
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

  BOOL isDetached = NO;
#ifdef EX_DETACHED
  isDetached = YES;
#endif

  constants[@"isDetached"] = @(isDetached);
  
  if (_unversionedConstants) {
    [constants addEntriesFromDictionary:_unversionedConstants];
  }

  if ([constants[@"appOwnership"] isEqualToString:@"expo"]) {
    NSMutableDictionary *platform = [constants[@"platform"] mutableCopy];
    NSMutableDictionary *ios = [platform[@"ios"] mutableCopy];
    [ios setValue:[NSNull null] forKey:@"buildNumber"];
    [platform setValue:ios forKey:@"ios"];
    [constants setValue:platform forKey:@"platform"];
  }

  return constants;
}

- (NSString *)expoClientVersion
{
  NSString *expoClientVersion = _unversionedConstants[EX_UNVERSIONED(@"expoRuntimeVersion")];
  if (expoClientVersion) {
    return expoClientVersion;
  } else {
    // not correct in standalone apps
    return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"];
  }
}

@end
