/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTTestRunner.h"

#import <ReactABI32_0_0/ABI32_0_0RCTAssert.h>
#import <ReactABI32_0_0/ABI32_0_0RCTBridge+Private.h>
#import <ReactABI32_0_0/ABI32_0_0RCTDevSettings.h>
#import <ReactABI32_0_0/ABI32_0_0RCTLog.h>
#import <ReactABI32_0_0/ABI32_0_0RCTRootView.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManager.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUtils.h>

#import "ABI32_0_0FBSnapshotTestController.h"
#import "ABI32_0_0RCTTestModule.h"

static const NSTimeInterval kTestTimeoutSeconds = 120;

@implementation ABI32_0_0RCTTestRunner
{
  FBSnapshotTestController *_testController;
  ABI32_0_0RCTBridgeModuleListProvider _moduleProvider;
  NSString *_appPath;
}

- (instancetype)initWithApp:(NSString *)app
         referenceDirectory:(NSString *)referenceDirectory
             moduleProvider:(ABI32_0_0RCTBridgeModuleListProvider)block
                  scriptURL:(NSURL *)scriptURL
{
  ABI32_0_0RCTAssertParam(app);
  ABI32_0_0RCTAssertParam(referenceDirectory);

  if ((self = [super init])) {
    if (!referenceDirectory.length) {
      referenceDirectory = [[NSBundle bundleForClass:self.class].resourcePath stringByAppendingPathComponent:@"ReferenceImages"];
    }

    NSString *sanitizedAppName = [app stringByReplacingOccurrencesOfString:@"/" withString:@"-"];
    sanitizedAppName = [sanitizedAppName stringByReplacingOccurrencesOfString:@"\\" withString:@"-"];
    _testController = [[FBSnapshotTestController alloc] initWithTestName:sanitizedAppName];
    _testController.referenceImagesDirectory = referenceDirectory;
    _moduleProvider = [block copy];
    _appPath = app;

    if (scriptURL != nil) {
      _scriptURL = scriptURL;
    } else {
      [self updateScript];
    }
  }
  return self;
}

ABI32_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)updateScript
{
  if (getenv("CI_USE_PACKAGER") || _useBundler) {
    _scriptURL = [NSURL URLWithString:[NSString stringWithFormat:@"http://localhost:8081/%@.bundle?platform=ios&dev=true", _appPath]];
  } else {
    _scriptURL = [[NSBundle bundleForClass:[ABI32_0_0RCTBridge class]] URLForResource:@"main" withExtension:@"jsbundle"];
  }
  ABI32_0_0RCTAssert(_scriptURL != nil, @"No scriptURL set");
}

- (void)setRecordMode:(BOOL)recordMode
{
  _testController.recordMode = recordMode;
}

- (BOOL)recordMode
{
  return _testController.recordMode;
}

- (void)setUseBundler:(BOOL)useBundler
{
  _useBundler = useBundler;
  [self updateScript];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
{
  [self runTest:test module:moduleName initialProps:nil configurationBlock:nil expectErrorBlock:nil];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(ABI32_0_0RCTRootView *rootView))configurationBlock
{
  [self runTest:test module:moduleName initialProps:initialProps configurationBlock:configurationBlock expectErrorBlock:nil];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(ABI32_0_0RCTRootView *rootView))configurationBlock
expectErrorRegex:(NSString *)errorRegex
{
  BOOL(^expectErrorBlock)(NSString *error)  = ^BOOL(NSString *error){
    return [error rangeOfString:errorRegex options:NSRegularExpressionSearch].location != NSNotFound;
  };

  [self runTest:test module:moduleName initialProps:initialProps configurationBlock:configurationBlock expectErrorBlock:expectErrorBlock];
}

- (void)runTest:(SEL)test module:(NSString *)moduleName
   initialProps:(NSDictionary<NSString *, id> *)initialProps
configurationBlock:(void(^)(ABI32_0_0RCTRootView *rootView))configurationBlock
expectErrorBlock:(BOOL(^)(NSString *error))expectErrorBlock
{
  __weak ABI32_0_0RCTBridge *batchedBridge;
  NSNumber *rootTag;
  ABI32_0_0RCTLogFunction defaultLogFunction = ABI32_0_0RCTGetLogFunction();
  // Catch all error logs, that are equivalent to redboxes in dev mode.
  __block NSMutableArray<NSString *> *errors = nil;
  ABI32_0_0RCTSetLogFunction(^(ABI32_0_0RCTLogLevel level, ABI32_0_0RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
    defaultLogFunction(level, source, fileName, lineNumber, message);
    if (level >= ABI32_0_0RCTLogLevelError) {
      if (errors == nil) {
        errors = [NSMutableArray new];
      }
      [errors addObject:message];
    }
  });

  @autoreleasepool {
    ABI32_0_0RCTBridge *bridge = [[ABI32_0_0RCTBridge alloc] initWithBundleURL:_scriptURL
                                              moduleProvider:_moduleProvider
                                               launchOptions:nil];
    [bridge.devSettings setIsDebuggingRemotely:_useJSDebugger];
    batchedBridge = [bridge batchedBridge];

    UIViewController *vc = ABI32_0_0RCTSharedApplication().delegate.window.rootViewController;
    vc.view = [UIView new];

    ABI32_0_0RCTTestModule *testModule = [bridge moduleForClass:[ABI32_0_0RCTTestModule class]];
    ABI32_0_0RCTAssert(_testController != nil, @"_testController should not be nil");
    testModule.controller = _testController;
    testModule.testSelector = test;
    testModule.testSuffix = _testSuffix;

    @autoreleasepool {
      // The rootView needs to be deallocated after this @autoreleasepool block exits.
      ABI32_0_0RCTRootView *rootView = [[ABI32_0_0RCTRootView alloc] initWithBridge:bridge moduleName:moduleName initialProperties:initialProps];
#if TARGET_OS_TV
      rootView.frame = CGRectMake(0, 0, 1920, 1080); // Standard screen size for tvOS
#else
      rootView.frame = CGRectMake(0, 0, 320, 2000); // Constant size for testing on multiple devices
#endif

      rootTag = rootView.ReactABI32_0_0Tag;
      testModule.view = rootView;

      [vc.view addSubview:rootView]; // Add as subview so it doesn't get resized

      if (configurationBlock) {
        configurationBlock(rootView);
      }

      NSDate *date = [NSDate dateWithTimeIntervalSinceNow:kTestTimeoutSeconds];
      while (date.timeIntervalSinceNow > 0 && testModule.status == ABI32_0_0RCTTestStatusPending && errors == nil) {
        [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
        [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
      }

      [rootView removeFromSuperview];
      testModule.view = nil;
    }

    // From this point on catch only fatal errors.
    ABI32_0_0RCTSetLogFunction(^(ABI32_0_0RCTLogLevel level, ABI32_0_0RCTLogSource source, NSString *fileName, NSNumber *lineNumber, NSString *message) {
      defaultLogFunction(level, source, fileName, lineNumber, message);
      if (level >= ABI32_0_0RCTLogLevelFatal) {
        if (errors == nil) {
          errors = [NSMutableArray new];
        }
        [errors addObject:message];
      }
    });

#if ABI32_0_0RCT_DEV
    NSArray<UIView *> *nonLayoutSubviews = [vc.view.subviews filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id subview, NSDictionary *bindings) {
      return ![NSStringFromClass([subview class]) isEqualToString:@"_UILayoutGuide"];
    }]];

    ABI32_0_0RCTAssert(nonLayoutSubviews.count == 0, @"There shouldn't be any other views: %@", nonLayoutSubviews);
#endif

    if (expectErrorBlock) {
      ABI32_0_0RCTAssert(expectErrorBlock(errors[0]), @"Expected an error but the first one was missing or did not match.");
    } else {
      ABI32_0_0RCTAssert(errors == nil, @"RedBox errors: %@", errors);
      ABI32_0_0RCTAssert(testModule.status != ABI32_0_0RCTTestStatusPending, @"Test didn't finish within %0.f seconds", kTestTimeoutSeconds);
      ABI32_0_0RCTAssert(testModule.status == ABI32_0_0RCTTestStatusPassed, @"Test failed");
    }

    // Wait for the rootView to be deallocated completely before invalidating the bridge.
    ABI32_0_0RCTUIManager *uiManager = [bridge moduleForClass:[ABI32_0_0RCTUIManager class]];
    NSDate *date = [NSDate dateWithTimeIntervalSinceNow:5];
    while (date.timeIntervalSinceNow > 0 && [uiManager viewForReactABI32_0_0Tag:rootTag]) {
      [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
      [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    }
    ABI32_0_0RCTAssert([uiManager viewForReactABI32_0_0Tag:rootTag] == nil, @"RootView should have been deallocated after removed.");

    [bridge invalidate];
  }

  // Wait for the bridge to disappear before continuing to the next test.
  NSDate *invalidateTimeout = [NSDate dateWithTimeIntervalSinceNow:30];
  while (invalidateTimeout.timeIntervalSinceNow > 0 && batchedBridge != nil) {
    [[NSRunLoop mainRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
    [[NSRunLoop mainRunLoop] runMode:NSRunLoopCommonModes beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  }
  ABI32_0_0RCTAssert(errors == nil, @"RedBox errors during bridge invalidation: %@", errors);
  ABI32_0_0RCTAssert(batchedBridge == nil, @"Bridge should be deallocated after the test");

  ABI32_0_0RCTSetLogFunction(defaultLogFunction);
}

@end
