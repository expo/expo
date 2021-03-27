//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

@import XCTest;

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncConfig.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncLegacyManifest.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncUtils.h>

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
  ABI40_0_0EXSyncConfig *sdkOnlyConfig = [[ABI40_0_0EXSyncConfig alloc] init];
  [sdkOnlyConfig loadConfigFromDictionary:@{ @"ABI40_0_0EXSyncScopeKey": @"test", @"ABI40_0_0EXSyncSDKVersion": @"38.0.0" }];
  XCTAssert([@"38.0.0" isEqualToString:[ABI40_0_0EXSyncUtils getRuntimeVersionWithConfig:sdkOnlyConfig]], @"should return SDK version if no runtime version is specified");
  
  ABI40_0_0EXSyncConfig *runtimeOnlyConfig = [[ABI40_0_0EXSyncConfig alloc] init];
  [runtimeOnlyConfig loadConfigFromDictionary:@{ @"ABI40_0_0EXSyncScopeKey": @"test", @"ABI40_0_0EXSyncRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[ABI40_0_0EXSyncUtils getRuntimeVersionWithConfig:runtimeOnlyConfig]], @"should return runtime version if no SDK version is specified");
  
  ABI40_0_0EXSyncConfig *bothConfig = [[ABI40_0_0EXSyncConfig alloc] init];
  [bothConfig loadConfigFromDictionary:@{ @"ABI40_0_0EXSyncScopeKey": @"test", @"ABI40_0_0EXSyncSDKVersion": @"38.0.0", @"ABI40_0_0EXSyncRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[ABI40_0_0EXSyncUtils getRuntimeVersionWithConfig:bothConfig]], @"should return runtime version if both are specified");
}

- (void)testNormalizedURLOrigin
{
  NSURL *urlNoPort = [NSURL URLWithString:@"https://exp.host/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[ABI40_0_0EXSyncConfig normalizedURLOrigin:urlNoPort]], @"should return a normalized URL origin with no port if none is specified");

  NSURL *urlDefaultPort = [NSURL URLWithString:@"https://exp.host:443/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[ABI40_0_0EXSyncConfig normalizedURLOrigin:urlDefaultPort]], @"should return a normalized URL origin with no port if default port is specified");

  NSURL *urlOtherPort = [NSURL URLWithString:@"https://exp.host:47/test"];
  XCTAssert([@"https://exp.host:47" isEqualToString:[ABI40_0_0EXSyncConfig normalizedURLOrigin:urlOtherPort]], @"should return a normalized URL origin with port if non-default port is specified");
}

- (void)testBundledAssetBaseUrl_assetUrlOverride
{
  ABI40_0_0EXSyncConfig *config = [[ABI40_0_0EXSyncConfig alloc] init];
  [config loadConfigFromDictionary:@{ @"ABI40_0_0EXSyncURL": @"https://esamelson.github.io/self-hosting-test/ios-index.json", @"ABI40_0_0EXSyncSDKVersion": @"38.0.0" }];

  NSString *absoluteUrlString = @"https://xxx.dev/~assets";
  NSURL *absoluteExpected = [NSURL URLWithString:absoluteUrlString];
  NSURL *absoluteActual = [ABI40_0_0EXSyncLegacyManifest bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": absoluteUrlString } config:config];
  XCTAssert([absoluteActual isEqual:absoluteExpected], @"should return the value of assetUrlOverride if it's an absolute URL");

  NSURL *relativeExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/my_assets"];
  NSURL *relativeActual = [ABI40_0_0EXSyncLegacyManifest bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": @"my_assets" } config:config];
  XCTAssert([relativeActual isEqual:relativeExpected], @"should return a URL relative to manifest URL base if it's a relative URL");

  NSURL *relativeDotSlashExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/assets"];
  NSURL *relativeDotSlashActual = [ABI40_0_0EXSyncLegacyManifest bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": @"./assets" } config:config];
  XCTAssert([relativeDotSlashActual isEqual:relativeDotSlashExpected], @"should return a URL relative to manifest URL base with `./` resolved correctly if it's a relative URL");

  NSURL *defaultExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/assets"];
  NSURL *defaultActual = [ABI40_0_0EXSyncLegacyManifest bundledAssetBaseUrlWithManifest:@{} config:config];
  XCTAssert([defaultActual isEqual:defaultExpected], @"should return a URL with `assets` relative to manifest URL base if unspecified");
}

@end

