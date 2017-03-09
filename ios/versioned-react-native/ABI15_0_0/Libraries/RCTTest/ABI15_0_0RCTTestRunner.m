/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI15_0_0RCTTestRunner.h"

#import <ReactABI15_0_0/ABI15_0_0RCTAssert.h>
#import <ReactABI15_0_0/ABI15_0_0RCTBridge+Private.h>
#import <ReactABI15_0_0/ABI15_0_0RCTJSCExecutor.h>
#import <ReactABI15_0_0/ABI15_0_0RCTLog.h>
#import <ReactABI15_0_0/ABI15_0_0RCTRootView.h>
#import <ReactABI15_0_0/ABI15_0_0RCTUtils.h>

#import "ABI15_0_0FBSnapshotTestController.h"
#import "ABI15_0_0RCTTestModule.h"

static const NSTimeInterval kTestTimeoutSeconds = 120;
static const NSTimeInterval kTestTeardownTimeoutSeconds = 30;

@implementation ABI15_0_0RCTTestRunner
{
  FBSnapshotTestController *_testController;
  ABI15_0_0RCTBridgeModuleProviderBlock _moduleProvider;
}

- (instancetype)initWithApp:(NSString *)app
         referenceDirectory:(NSString *)referenceDirectory
             moduleProvider:(ABI15_0_0RCTBridgeModuleProviderBlock)block
{
  ABI15_0_0RCTAssertParam(app);
  ABI15_0_0RCTAssertParam(referenceDirectory);

  if ((self = [super init])) {
    if (!referenceDirectory.length) {
      referenceDirectory = [[NSBundle bundleForClass:self.class].resourcePath stringByAppendingPathComponent:@"ReferenceImages"];
    }

    NSString *sanitizedAppName = [app stringByReplacingOccurrencesOfString:@"/" withString:@"-"];
    sanitizedAppName = [sanitizedAppName stringByReplacingOccurrencesOfString:@"\\" withString:@"-"];
    _testController = [[FBSnapshotTestController alloc] initWithTestName:sanitizedAppName];
    _testController.referenceImagesDirectory = referenceDirectory;
    _moduleProvider = [block copy];

    if (getenv("CI_USE_PACKAGER")) {
      _scriptURL = [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.bundle?platform=ios&dev=true", app]];
    } else {
      _scriptURL = [[NSBundle bundleForClass:[ABI15_0_0RCTBridge class]] URLForResource:@"main" withExtension:@"jsbundle"];
    }
    ABI15_0_0RCTAssert(_scriptURL != nil, @"No scriptURL set");
  }
  return self;
}

ABI15_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)setRecordMode:(BOOL)recordMode
{
  _testController.recordMode = recordMode;
}

- (BOOL)recordMode
{
  return _testController.recordMode;
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
{
  [self runTest:test module:moduleName initialProps:nil configurationBlock:nil expectErrorBlock:nil];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(ABI15_0_0RCTRootView *rootView))configurationBlock
{
  [self runTest:test module:moduleName initialProps:initialProps configurationBlock:configurationBlock expectErrorBlock:nil];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(ABI15_0_0RCTRootView *rootView))configurationBlock
expectErrorRegex:(NSString *)errorRegex
{
  BOOL(^expectErrorBlock)(NSString *error)  = ^BOOL(NSString *error){
    return [error rangeOfString:errorRegex options:NSRegularExpressionSearch].location != NSNotFound;
  };

  [self runTest:test module:moduleName initialProps:initialProps configurationBlock:configurationBlock expectErrorBlock:expectErrorBlock];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(ABI15_0_0RCTRootView *rootView))configurationBlock
expectErrorBlock:(BOOL(^)(NSString *error))expectErrorBlock
{
  __weak id weakJSContext;

  @autoreleasepool {
    __block NSString *error = nil;
    ABI15_0_0RCTSetLogFunction(^(ABI15_0_0RCTLogLevel level, ABI15_0_0RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
      if (level >= ABI15_0_0RCTLogLevelError) {
        error = message;
      }
    });

    ABI15_0_0RCTBridge *bridge = [[ABI15_0_0RCTBridge alloc] initWithBundleURL:_scriptURL
                                              moduleProvider:_moduleProvider
                                               launchOptions:nil];

    ABI15_0_0RCTRootView *rootView = [[ABI15_0_0RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProps];
#if TARGET_OS_TV
    rootView.frame = CGRectMake(0, 0, 1920, 1080); // Standard screen size for tvOS
#else
    rootView.frame = CGRectMake(0, 0, 320, 2000); // Constant size for testing on multiple devices
#endif

    ABI15_0_0RCTTestModule *testModule = [rootView.bridge moduleForClass:[ABI15_0_0RCTTestModule class]];
    ABI15_0_0RCTAssert(_testController != nil, @"_testController should not be nil");
    testModule.controller = _testController;
    testModule.testSelector = test;
    testModule.testSuffix = _testSuffix;
    testModule.view = rootView;

    UIViewController *vc = [UIApplication sharedApplication].delegate.window.rootViewController;
    vc.view = [UIView new];
    [vc.view addSubview:rootView]; // Add as subview so it doesn't get resized

    if (configurationBlock) {
      configurationBlock(rootView);
    }

    NSDate *date = [NSDate dateWithTimeIntervalSinceNow:kTestTimeoutSeconds];
    while (date.timeIntervalSinceNow > 0 && testModule.status == ABI15_0_0RCTTestStatusPending && error == nil) {
      [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
      [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    }

    // Take a weak reference to the JS context, so we track its deallocation later
    // (we can only do this now, since it's been lazily initialized)
    id jsExecutor = [bridge.batchedBridge valueForKey:@"javaScriptExecutor"];
    if ([jsExecutor isKindOfClass:[ABI15_0_0RCTJSCExecutor class]]) {
      weakJSContext = [jsExecutor valueForKey:@"_context"];
    }
    [rootView removeFromSuperview];

    ABI15_0_0RCTSetLogFunction(ABI15_0_0RCTDefaultLogFunction);

    NSArray<UIView *> *nonLayoutSubviews = [vc.view.subviews filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id subview, NSDictionary *bindings) {
      return ![NSStringFromClass([subview class]) isEqualToString:@"_UILayoutGuide"];
    }]];
    ABI15_0_0RCTAssert(nonLayoutSubviews.count == 0, @"There shouldn't be any other views: %@", nonLayoutSubviews);

    if (expectErrorBlock) {
      ABI15_0_0RCTAssert(expectErrorBlock(error), @"Expected an error but nothing matched.");
    } else {
      ABI15_0_0RCTAssert(error == nil, @"RedBox error: %@", error);
      ABI15_0_0RCTAssert(testModule.status != ABI15_0_0RCTTestStatusPending, @"Test didn't finish within %0.f seconds", kTestTimeoutSeconds);
      ABI15_0_0RCTAssert(testModule.status == ABI15_0_0RCTTestStatusPassed, @"Test failed");
    }
    [bridge invalidate];
  }

  // Wait for the executor to have shut down completely before returning
  NSDate *teardownTimeout = [NSDate dateWithTimeIntervalSinceNow:kTestTeardownTimeoutSeconds];
  while (teardownTimeout.timeIntervalSinceNow > 0 && weakJSContext) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  ABI15_0_0RCTAssert(!weakJSContext, @"JS context was not deallocated after being invalidated");
}

@end
