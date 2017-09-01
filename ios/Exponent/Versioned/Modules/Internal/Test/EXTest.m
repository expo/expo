// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXTest.h"
#import "EXUnversioned.h"

NSNotificationName EXTestSuiteCompletedNotification = @"EXTestSuiteCompletedNotification";

@implementation EXTest

+ (NSString *)moduleName { return @"ExponentTest"; }

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

RCT_EXPORT_METHOD(action: (NSDictionary *)params)
{
  // TODO
  NSLog(@"action native");
}

@end
