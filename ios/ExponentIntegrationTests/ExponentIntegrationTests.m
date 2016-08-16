// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelModuleProvider.h"

#import "RCTTestRunner.h"
#import "RCTAssert.h"

#import <XCTest/XCTest.h>

@interface ExponentIntegrationTests : XCTestCase

@end

@implementation ExponentIntegrationTests
{
  RCTTestRunner *_runner;
}

- (void)setUp
{
  [super setUp];

#if __LP64__
  RCTAssert(NO, @"Tests should be run on 32-bit device simulators (e.g. iPhone 5)");
#endif
  
  NSOperatingSystemVersion version = [NSProcessInfo processInfo].operatingSystemVersion;
  RCTAssert((version.majorVersion == 8 && version.minorVersion >= 3) || version.majorVersion >= 9, @"Tests should be run on iOS 8.3+, found %zd.%zd.%zd", version.majorVersion, version.minorVersion, version.patchVersion);
  
  NSArray<id<RCTBridgeModule>> *(^testModuleProvider)(void) = ^NSArray<id<RCTBridgeModule>> *(void) {
    return EXKernelModuleProvider(nil);
  };
  _runner = RCTInitRunnerForApp(@"ExponentTestsApp", testModuleProvider);
}

- (void)testFrameLoadCuriousPeople
{
  [_runner runTest:_cmd
            module:@"FrameTests"
      initialProps:@{@"manifestUrl": @"exp://exp.host/@exponent/react-native-for-curious-people"}
configurationBlock:nil];
}

- (void)testFrameLoadFeaturedExperience
{
  [_runner runTest:_cmd
            module:@"FrameTests"
      initialProps:@{@"loadFeaturedExperience": @YES}
configurationBlock:nil];
}

@end
