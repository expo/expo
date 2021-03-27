//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

@import XCTest;

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncConfig.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncUtils.h>

@interface Tests : XCTestCase

@end

@implementation Tests

- (void)setUp
{
    [super setUp];
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown
{
    // Put teardown code here. This method is called after the invocation of each test method in the class.
    [super tearDown];
}

- (void)testGetRuntimeVersionWithConfig
{
  ABI39_0_0EXSyncConfig *sdkOnlyConfig = [[ABI39_0_0EXSyncConfig alloc] init];
  [sdkOnlyConfig loadConfigFromDictionary:@{ @"ABI39_0_0EXSyncSDKVersion": @"38.0.0" }];
  XCTAssert([@"38.0.0" isEqualToString:[ABI39_0_0EXSyncUtils getRuntimeVersionWithConfig:sdkOnlyConfig]], @"should return SDK version if no runtime version is specified");
  
  ABI39_0_0EXSyncConfig *runtimeOnlyConfig = [[ABI39_0_0EXSyncConfig alloc] init];
  [runtimeOnlyConfig loadConfigFromDictionary:@{ @"ABI39_0_0EXSyncRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[ABI39_0_0EXSyncUtils getRuntimeVersionWithConfig:runtimeOnlyConfig]], @"should return runtime version if no SDK version is specified");
  
  ABI39_0_0EXSyncConfig *bothConfig = [[ABI39_0_0EXSyncConfig alloc] init];
  [bothConfig loadConfigFromDictionary:@{ @"ABI39_0_0EXSyncSDKVersion": @"38.0.0", @"ABI39_0_0EXSyncRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[ABI39_0_0EXSyncUtils getRuntimeVersionWithConfig:bothConfig]], @"should return runtime version if both are specified");
}

- (void)testNormalizedURLOrigin
{
  NSURL *urlNoPort = [NSURL URLWithString:@"https://exp.host/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[ABI39_0_0EXSyncConfig normalizedURLOrigin:urlNoPort]], @"should return a normalized URL origin with no port if none is specified");

  NSURL *urlDefaultPort = [NSURL URLWithString:@"https://exp.host:443/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[ABI39_0_0EXSyncConfig normalizedURLOrigin:urlDefaultPort]], @"should return a normalized URL origin with no port if default port is specified");

  NSURL *urlOtherPort = [NSURL URLWithString:@"https://exp.host:47/test"];
  XCTAssert([@"https://exp.host:47" isEqualToString:[ABI39_0_0EXSyncConfig normalizedURLOrigin:urlOtherPort]], @"should return a normalized URL origin with port if non-default port is specified");
}

@end

