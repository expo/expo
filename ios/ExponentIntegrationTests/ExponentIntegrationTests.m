// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoKit.h"
#import "EXKernel.h"
#import "EXKernelLinkingManager.h"
#import "EXRootViewController.h"
#import "EXShellManager.h"
#import "EXTest.h"

#import <React/RCTAssert.h>
#import <React/RCTUtils.h>

#import <XCTest/XCTest.h>

@interface ExponentIntegrationTests : XCTestCase

@property (nonatomic, strong) EXRootViewController *rootViewController;
@property (nonatomic, strong) NSDictionary *jsTestSuiteResult;
@property (nonatomic, strong) NSString *testSuiteUrl;

@end

@implementation ExponentIntegrationTests

- (void)setUp
{
  [super setUp];
  [self _loadConfig];

  _jsTestSuiteResult = nil;
  _rootViewController = (EXRootViewController *)[ExpoKit sharedInstance].rootViewController;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_onKernelJSLoaded)
                                               name:kEXKernelJSIsLoadedNotification
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_onTestSuiteCompleted:)
                                               name:EXTestSuiteCompletedNotification object:nil];
}

- (void)testDoesTestSuiteAppPassAllJSTests
{
  XCTAssert((_testSuiteUrl), @"No url configured for JS test-suite. Make sure EXTestEnvironment.plist exists and contains a url to test-suite.");
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

- (void)_loadConfig
{
  NSString *configPath = [[NSBundle bundleForClass:[self class]] pathForResource:@"EXTestEnvironment" ofType:@"plist"];
  NSDictionary *testConfig = (configPath) ? [NSDictionary dictionaryWithContentsOfFile:configPath] : [NSDictionary dictionary];
  if (testConfig) {
    _testSuiteUrl = testConfig[@"testSuiteUrl"];
  }
}

- (void)_onKernelJSLoaded
{
  // if test environment isn't configured for a shell app, override here
  // since clearly we're running tests
  if ([EXShellManager sharedInstance].testEnvironment == EXTestEnvironmentNone) {
    [EXShellManager sharedInstance].testEnvironment = EXTestEnvironmentLocal;
  }
  [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:_testSuiteUrl isUniversalLink:NO];
}

- (void)_onTestSuiteCompleted:(NSNotification *)notif
{
  _jsTestSuiteResult = notif.userInfo;
}

@end
