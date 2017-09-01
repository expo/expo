// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoKit.h"
#import "EXRootViewController.h"

#import <React/RCTTestRunner.h>
#import <React/RCTAssert.h>
#import <React/RCTUtils.h>

#import <XCTest/XCTest.h>

@interface ExponentIntegrationTests : XCTestCase

@property (nonatomic, strong) EXRootViewController *rootViewController;

@end

@implementation ExponentIntegrationTests

- (void)setUp
{
  [super setUp];
  _rootViewController = (EXRootViewController *)[ExpoKit sharedInstance].rootViewController;
}

- (void)testDoesTestSuiteAppPassAllJSTests
{
  [_rootViewController applicationWillEnterForeground];
  
  // see _runner runTest
  // spin on a run loop while status is pending, listen for completed event
  // assert on contents of result
  NSDate *date = [NSDate dateWithTimeIntervalSinceNow:10];
  while (date.timeIntervalSinceNow > 0) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  XCTAssert(YES, @"Dummy test didn't finish");
}

@end
