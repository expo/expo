// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoKit.h"
#import "EXKernel.h"
#import "EXKernelLinkingManager.h"
#import "EXRootViewController.h"
#import "EXHomeAppManager.h"
#import "EXShellManager.h"
#import "EXTest.h"

#import <React/RCTAssert.h>
#import <React/RCTUtils.h>

#import <XCTest/XCTest.h>

@interface ExponentIntegrationTests : XCTestCase

@property (nonatomic, strong) EXRootViewController *rootViewController;
@property (nonatomic, strong) NSString *testSuiteUrl;

@end

@implementation ExponentIntegrationTests

- (void)setUp
{
  [super setUp];
  [self _loadConfig];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(_onKernelJSLoaded)
                                               name:kEXHomeJSIsLoadedNotification
                                             object:nil];
  
}

- (void)testDoesTestSuiteAppPassAllJSTests
{
  XCTAssert((_testSuiteUrl), @"No url configured for JS test-suite. Make sure EXTestEnvironment.plist exists and contains a url to test-suite.");
  
  XCTestExpectation *expectation = [[XCTestExpectation alloc] initWithDescription: @"Run all JS integration tests"];
  
  __block NSDictionary *jsTestSuiteResult = nil;
  id<NSObject> observer = [NSNotificationCenter.defaultCenter
                           addObserverForName:EXTestSuiteCompletedNotification
                           object:nil
                           queue:NSOperationQueue.currentQueue
                           usingBlock:^(NSNotification *notification) {
                             jsTestSuiteResult = notification.userInfo;
                             [expectation fulfill];
                           }];
  
  [self waitForExpectations:@[expectation] timeout:180];
  [NSNotificationCenter.defaultCenter removeObserver:observer];
  
  XCTAssert((jsTestSuiteResult), @"Test suite timed out");
  XCTAssert(([jsTestSuiteResult[@"failed"] integerValue] == 0), @"Test suite failed: %@", jsTestSuiteResult);
}

#pragma mark - internal

- (void)_loadConfig
{
  // This plist is generated with `powertools configure-ios-test-suite-url`
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
  
  // NOTE(2018-02-20): Without giving the kernel a second to run, it never opens test-suite. With a
  // cursory pass through the code, I didn't see the correct event to wait for. Perhaps after we
  // implement a pure-native kernel, we'll be able to remove this shoddy delay.
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:_testSuiteUrl isUniversalLink:NO];
  });
}

@end
