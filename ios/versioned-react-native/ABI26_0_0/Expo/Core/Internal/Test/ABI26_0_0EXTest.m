// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXTest.h"
#import "ABI26_0_0EXUnversioned.h"

#import <os/log.h>

NSNotificationName ABI26_0_0EXTestSuiteCompletedNotification = @"ABI26_0_0EXTestSuiteCompletedNotification";

@interface ABI26_0_0EXTest ()

@property (class, nonatomic, assign, readonly) os_log_t log;
@property (nonatomic, assign) ABI26_0_0EXTestEnvironment environment;

@end

@implementation ABI26_0_0EXTest

+ (NSString *)moduleName { return @"ExponentTest"; }

+ (os_log_t)log {
  static os_log_t log;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    log = os_log_create("host.exp.Exponent", "test");
  });
  return log;
}

- (instancetype)initWithEnvironment:(ABI26_0_0EXTestEnvironment)environment
{
  if (self = [super init]) {
    _environment = environment;
  }
  return self;
}

ABI26_0_0RCT_EXPORT_METHOD(completed: (NSString *)jsonStringifiedResult)
{
  NSDictionary *failedResult = @{ @"failed": @(1) };
  
  __block NSError *jsonError;
  NSData *jsonData = [jsonStringifiedResult dataUsingEncoding:NSUTF8StringEncoding];
  id resultObj = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&jsonError];
  if (jsonError) {
    resultObj = failedResult;
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:@"EXTestSuiteCompletedNotification"
                                                      object:nil
                                                    userInfo:resultObj];
  
  os_log(ABI26_0_0EXTest.log, "[TEST-SUITE-END] %{public}@", jsonStringifiedResult);
}

ABI26_0_0RCT_REMAP_METHOD(action,
                 actionWithParams:(NSDictionary *)params
                 withResolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(__unused ABI26_0_0RCTPromiseRejectBlock)reject)
{
  // stub on iOS
  resolve(@{});
}

ABI26_0_0RCT_REMAP_METHOD(shouldSkipTestsRequiringPermissionsAsync,
                 shouldSkipTestsRequiringPermissionsWithResolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(__unused ABI26_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@(_environment == ABI26_0_0EXTestEnvironmentCI));
}

#pragma mark - util

+ (ABI26_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString
{
  if ([testEnvironmentString isEqualToString:@"local"]) {
    return ABI26_0_0EXTestEnvironmentLocal;
  } else if ([testEnvironmentString isEqualToString:@"ci"]) {
    return ABI26_0_0EXTestEnvironmentCI;
  }
  return ABI26_0_0EXTestEnvironmentNone;
}

@end
