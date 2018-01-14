// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXTest.h"
#import "ABI25_0_0EXUnversioned.h"

NSNotificationName ABI25_0_0EXTestSuiteCompletedNotification = @"ABI25_0_0EXTestSuiteCompletedNotification";

@interface ABI25_0_0EXTest ()

@property (nonatomic, assign) ABI25_0_0EXTestEnvironment environment;

@end

@implementation ABI25_0_0EXTest

+ (NSString *)moduleName { return @"ExponentTest"; }

- (instancetype)initWithEnvironment:(ABI25_0_0EXTestEnvironment)environment
{
  if (self = [super init]) {
    _environment = environment;
  }
  return self;
}

ABI25_0_0RCT_EXPORT_METHOD(completed: (NSString *)jsonStringifiedResult)
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
}

ABI25_0_0RCT_REMAP_METHOD(action,
                 actionWithParams:(NSDictionary *)params
                 withResolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(__unused ABI25_0_0RCTPromiseRejectBlock)reject)
{
  // stub on iOS
  resolve(@{});
}

ABI25_0_0RCT_REMAP_METHOD(shouldSkipTestsRequiringPermissionsAsync,
                 shouldSkipTestsRequiringPermissionsWithResolver:(ABI25_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(__unused ABI25_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@(_environment == ABI25_0_0EXTestEnvironmentCI));
}

#pragma mark - util

+ (ABI25_0_0EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString
{
  if ([testEnvironmentString isEqualToString:@"local"]) {
    return ABI25_0_0EXTestEnvironmentLocal;
  } else if ([testEnvironmentString isEqualToString:@"ci"]) {
    return ABI25_0_0EXTestEnvironmentCI;
  }
  return ABI25_0_0EXTestEnvironmentNone;
}

@end
