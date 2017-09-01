// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoKit.h"
#import "EXRootViewController.h"
#import "EXTest.h"

#import <React/RCTAssert.h>
#import <React/RCTUtils.h>

#import <XCTest/XCTest.h>

#define TEST_ENVIRONMENT 1

@interface ExponentIntegrationTests : XCTestCase

@property (nonatomic, strong) EXRootViewController *rootViewController;
@property (nonatomic, strong) NSDictionary *jsTestSuiteResult;

@end

@implementation ExponentIntegrationTests

- (void)setUp
{
  [super setUp];

  _jsTestSuiteResult = nil;
  _rootViewController = (EXRootViewController *)[ExpoKit sharedInstance].rootViewController;
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_onTestSuiteCompleted:) name:EXTestSuiteCompletedNotification object:nil];
}

- (void)testDoesTestSuiteAppPassAllJSTests
{
  [_rootViewController applicationWillEnterForeground];

  // wait for JS
  NSDate *dateToTimeOut = [NSDate dateWithTimeIntervalSinceNow:60];
  while (dateToTimeOut.timeIntervalSinceNow > 0 && _jsTestSuiteResult == nil) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  XCTAssert((_jsTestSuiteResult), @"Test suite timed out");
  XCTAssert(([_jsTestSuiteResult[@"failed"] integerValue] == 0), @"Test suite failed: %@", _jsTestSuiteResult);
}

#pragma mark - internal

- (void)_onTestSuiteCompleted:(NSNotification *)notif
{
  _jsTestSuiteResult = notif.userInfo;
}

@end
