// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXTest.h"
#import "EXUnversioned.h"

NSNotificationName EXTestSuiteCompletedNotification = @"EXTestSuiteCompletedNotification";

@interface EXTest ()

@property (nonatomic, assign) EXTestEnvironment environment;

@end

@implementation EXTest

+ (NSString *)moduleName { return @"ExponentTest"; }

- (instancetype)initWithEnvironment:(EXTestEnvironment)environment
{
  if (self = [super init]) {
    _environment = environment;
  }
  return self;
}

RCT_EXPORT_METHOD(completed: (NSString *)jsonStringifiedResult)
{
  NSDictionary *failedResult = @{ @"failed": @(1) };
  
  __block NSError *jsonError;
  NSData *jsonData = [jsonStringifiedResult dataUsingEncoding:NSUTF8StringEncoding];
  id resultObj = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&jsonError];
  if (jsonError) {
    resultObj = failedResult;
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:EX_UNVERSIONED(@"EXTestSuiteCompletedNotification")
                                                      object:nil
                                                    userInfo:resultObj];
}

RCT_REMAP_METHOD(action,
                 actionWithParams:(NSDictionary *)params
                 withResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  // stub on iOS
  resolve(@{});
}

RCT_REMAP_METHOD(shouldSkipTestsRequiringPermissionsAsync,
                 shouldSkipTestsRequiringPermissionsWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  resolve(@(_environment == EXTestEnvironmentCI));
}

#pragma mark - util

+ (EXTestEnvironment)testEnvironmentFromString:(NSString *)testEnvironmentString
{
  if ([testEnvironmentString isEqualToString:@"local"]) {
    return EXTestEnvironmentLocal;
  } else if ([testEnvironmentString isEqualToString:@"ci"]) {
    return EXTestEnvironmentCI;
  }
  return EXTestEnvironmentNone;
}

@end
