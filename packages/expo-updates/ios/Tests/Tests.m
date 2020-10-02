//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

@import XCTest;

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesLegacyUpdate.h>
#import <EXUpdates/EXUpdatesUtils.h>

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
  EXUpdatesConfig *sdkOnlyConfig = [[EXUpdatesConfig alloc] init];
  [sdkOnlyConfig loadConfigFromDictionary:@{ @"EXUpdatesScopeKey": @"test", @"EXUpdatesSDKVersion": @"38.0.0" }];
  XCTAssert([@"38.0.0" isEqualToString:[EXUpdatesUtils getRuntimeVersionWithConfig:sdkOnlyConfig]], @"should return SDK version if no runtime version is specified");
  
  EXUpdatesConfig *runtimeOnlyConfig = [[EXUpdatesConfig alloc] init];
  [runtimeOnlyConfig loadConfigFromDictionary:@{ @"EXUpdatesScopeKey": @"test", @"EXUpdatesRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[EXUpdatesUtils getRuntimeVersionWithConfig:runtimeOnlyConfig]], @"should return runtime version if no SDK version is specified");
  
  EXUpdatesConfig *bothConfig = [[EXUpdatesConfig alloc] init];
  [bothConfig loadConfigFromDictionary:@{ @"EXUpdatesScopeKey": @"test", @"EXUpdatesSDKVersion": @"38.0.0", @"EXUpdatesRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[EXUpdatesUtils getRuntimeVersionWithConfig:bothConfig]], @"should return runtime version if both are specified");
}

- (void)testNormalizedURLOrigin
{
  NSURL *urlNoPort = [NSURL URLWithString:@"https://exp.host/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[EXUpdatesConfig normalizedURLOrigin:urlNoPort]], @"should return a normalized URL origin with no port if none is specified");

  NSURL *urlDefaultPort = [NSURL URLWithString:@"https://exp.host:443/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[EXUpdatesConfig normalizedURLOrigin:urlDefaultPort]], @"should return a normalized URL origin with no port if default port is specified");

  NSURL *urlOtherPort = [NSURL URLWithString:@"https://exp.host:47/test"];
  XCTAssert([@"https://exp.host:47" isEqualToString:[EXUpdatesConfig normalizedURLOrigin:urlOtherPort]], @"should return a normalized URL origin with port if non-default port is specified");
}

- (void)testBundledAssetBaseUrl_assetUrlOverride
{
  EXUpdatesConfig *config = [[EXUpdatesConfig alloc] init];
  [config loadConfigFromDictionary:@{ @"EXUpdatesURL": @"https://esamelson.github.io/self-hosting-test/ios-index.json", @"EXUpdatesSDKVersion": @"38.0.0" }];

  NSString *absoluteUrlString = @"https://xxx.dev/~assets";
  NSURL *absoluteExpected = [NSURL URLWithString:absoluteUrlString];
  NSURL *absoluteActual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": absoluteUrlString } config:config];
  XCTAssert([absoluteActual isEqual:absoluteExpected], @"should return the value of assetUrlOverride if it's an absolute URL");

  NSURL *relativeExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/my_assets"];
  NSURL *relativeActual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": @"my_assets" } config:config];
  XCTAssert([relativeActual isEqual:relativeExpected], @"should return a URL relative to manifest URL base if it's a relative URL");

  NSURL *relativeDotSlashExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/assets"];
  NSURL *relativeDotSlashActual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": @"./assets" } config:config];
  XCTAssert([relativeDotSlashActual isEqual:relativeDotSlashExpected], @"should return a URL relative to manifest URL base with `./` resolved correctly if it's a relative URL");

  NSURL *defaultExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/assets"];
  NSURL *defaultActual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{} config:config];
  XCTAssert([defaultActual isEqual:defaultExpected], @"should return a URL with `assets` relative to manifest URL base if unspecified");
}

@end

