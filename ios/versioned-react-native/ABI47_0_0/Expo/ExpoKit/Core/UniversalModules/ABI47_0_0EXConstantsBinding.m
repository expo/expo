// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI47_0_0EXConstantsBinding.h"
#import "ABI47_0_0EXUnversioned.h"

@interface ABI47_0_0EXConstantsBinding ()

@property (nonatomic, strong) NSString *appOwnership;
@property (nonatomic, strong) NSDictionary *unversionedConstants;

@end

@implementation ABI47_0_0EXConstantsBinding : ABI47_0_0EXConstantsService

- (instancetype)initWithParams:(NSDictionary *)params
{
  if (self = [super init]) {
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
#ifdef ABI47_0_0EX_DETACHED
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
  NSString *expoClientVersion = _unversionedConstants[@"expoRuntimeVersion"];
  if (expoClientVersion) {
    return expoClientVersion;
  } else {
    // not correct in standalone apps
    return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"];
  }
}

@end
