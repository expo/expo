//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesLegacyUpdate.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate.h>

@interface ABI41_0_0EXUpdatesLegacyUpdateTests : XCTestCase

@property (nonatomic, strong) ABI41_0_0EXUpdatesConfig *config;
@property (nonatomic, strong) ABI41_0_0EXUpdatesConfig *selfHostedConfig;
@property (nonatomic, strong) ABI41_0_0EXUpdatesDatabase *database;

@end

@implementation ABI41_0_0EXUpdatesLegacyUpdateTests

- (void)setUp
{
  _config = [ABI41_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI41_0_0EXUpdatesURL": @"https://exp.host/@test/test",
    @"ABI41_0_0EXUpdatesUsesLegacyManifest": @(YES)
  }];

  _selfHostedConfig = [ABI41_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI41_0_0EXUpdatesURL": @"https://esamelson.github.io/self-hosting-test/ios-index.json",
    @"ABI41_0_0EXUpdatesSDKVersion": @"38.0.0"
  }];

  _database = [ABI41_0_0EXUpdatesDatabase new];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testBundledAssetBaseUrl_ExpoDomain
{
  NSURL *expected = [NSURL URLWithString:@"https://d1wp6m56sqw74a.cloudfront.net/~assets/"];
  XCTAssert([expected isEqual:[ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{} config:[ABI41_0_0EXUpdatesConfig configWithDictionary:@{@"ABI41_0_0EXUpdatesURL": @"https://exp.host/@test/test"}]]]);
  XCTAssert([expected isEqual:[ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{} config:[ABI41_0_0EXUpdatesConfig configWithDictionary:@{@"ABI41_0_0EXUpdatesURL": @"https://expo.io/@test/test"}]]]);
  XCTAssert([expected isEqual:[ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{} config:[ABI41_0_0EXUpdatesConfig configWithDictionary:@{@"ABI41_0_0EXUpdatesURL": @"https://expo.test/@test/test"}]]]);
}

- (void)testBundledAssetBaseUrl_ExpoSubdomain
{
  NSURL *expected = [NSURL URLWithString:@"https://d1wp6m56sqw74a.cloudfront.net/~assets/"];
  XCTAssert([expected isEqual:[ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{} config:[ABI41_0_0EXUpdatesConfig configWithDictionary:@{@"ABI41_0_0EXUpdatesURL": @"https://staging.exp.host/@test/test"}]]]);
  XCTAssert([expected isEqual:[ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{} config:[ABI41_0_0EXUpdatesConfig configWithDictionary:@{@"ABI41_0_0EXUpdatesURL": @"https://staging.expo.io/@test/test"}]]]);
  XCTAssert([expected isEqual:[ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{} config:[ABI41_0_0EXUpdatesConfig configWithDictionary:@{@"ABI41_0_0EXUpdatesURL": @"https://staging.expo.test/@test/test"}]]]);
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_AbsoluteUrl
{
  NSString *absoluteUrlString = @"https://xxx.dev/~assets";
  NSURL *absoluteExpected = [NSURL URLWithString:absoluteUrlString];
  NSURL *absoluteActual = [ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": absoluteUrlString } config:_selfHostedConfig];
  XCTAssert([absoluteActual isEqual:absoluteExpected], @"should return the value of assetUrlOverride if it's an absolute URL");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_RelativeUrl
{
  NSURL *relativeExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/my_assets"];
  NSURL *relativeActual = [ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": @"my_assets" } config:_selfHostedConfig];
  XCTAssert([relativeActual isEqual:relativeExpected], @"should return a URL relative to manifest URL base if it's a relative URL");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_OriginRelativeUrl
{
  NSURL *originRelativeExpected = [NSURL URLWithString:@"https://esamelson.github.io/my_assets"];
  NSURL *originRelativeActual = [ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": @"/my_assets" } config:_selfHostedConfig];
  XCTAssert([originRelativeActual isEqual:originRelativeExpected], @"should return a URL relative to manifest URL base if it's an origin-relative URL");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_RelativeUrlDotSlash
{
  NSURL *relativeDotSlashExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/my_assets"];
  NSURL *relativeDotSlashActual = [ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": @"./my_assets" } config:_selfHostedConfig];
  XCTAssert([relativeDotSlashActual isEqual:relativeDotSlashExpected], @"should return a URL relative to manifest URL base with `./` resolved correctly if it's a relative URL");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_Normalize
{
  NSURL *expected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/b"];
  NSURL *actual = [ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": @"./a/../b" } config:_selfHostedConfig];
  XCTAssert([actual isEqual:expected], @"should return a correctly normalized URL relative to manifest URL base");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_NormalizeToHostname
{
  NSURL *expected = [NSURL URLWithString:@"https://esamelson.github.io/b"];
  NSURL *actual = [ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": @"../b" } config:_selfHostedConfig];
  XCTAssert([actual isEqual:expected], @"should return a correctly normalized URL relative to manifest URL base if the relative path goes back to the hostname");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_NormalizePastHostname
{
  NSURL *expected = [NSURL URLWithString:@"https://esamelson.github.io/b"];
  NSURL *actual = [ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{ @"assetUrlOverride": @"../../b" } config:_selfHostedConfig];
  XCTAssert([actual isEqual:expected], @"should return a correctly normalized URL relative to manifest URL base if the relative path goes back past the hostname");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_Default
{
  NSURL *defaultExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/assets"];
  NSURL *defaultActual = [ABI41_0_0EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:@{} config:_selfHostedConfig];
  XCTAssert([defaultActual isEqual:defaultExpected], @"should return a URL with `assets` relative to manifest URL base if unspecified");
}

- (void)testUpdateWithLegacyManifest_Development
{
  // manifests served from a developer tool should not need the releaseId and commitTime fields
  NSDictionary *manifest = @{
    @"sdkVersion": @"39.0.0",
    @"bundleUrl": @"https://url.to/bundle.js",
    @"developer": @{@"tool": @"expo-cli"}
  };
  XCTAssert([ABI41_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database] != nil);
}

- (void)testUpdateWithLegacyManifest_Production_AllFields
{
  // production manifests should require the releaseId, commitTime, sdkVersion, and bundleUrl fields
  NSDictionary *manifest = @{
    @"sdkVersion": @"39.0.0",
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @"2020-11-11T00:17:54.797Z",
    @"bundleUrl": @"https://url.to/bundle.js"
  };
  XCTAssert([ABI41_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database] != nil);
}

- (void)testUpdateWithLegacyManifest_Production_NoSdkVersion
{
  NSDictionary *manifest = @{
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @"2020-11-11T00:17:54.797Z",
    @"bundleUrl": @"https://url.to/bundle.js"
  };
  XCTAssertThrows([ABI41_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database]);
}

- (void)testUpdateWithLegacyManifest_Production_NoReleaseId
{
  NSDictionary *manifest = @{
    @"sdkVersion": @"39.0.0",
    @"commitTime": @"2020-11-11T00:17:54.797Z",
    @"bundleUrl": @"https://url.to/bundle.js"
  };
  XCTAssertThrows([ABI41_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database]);
}

- (void)testUpdateWithLegacyManifest_Production_NoCommitTime
{
  NSDictionary *manifest = @{
    @"sdkVersion": @"39.0.0",
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"bundleUrl": @"https://url.to/bundle.js"
  };
  XCTAssertThrows([ABI41_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database]);
}

- (void)testUpdateWithLegacyManifest_Production_NoBundleUrl
{
  NSDictionary *manifest = @{
    @"sdkVersion": @"39.0.0",
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @"2020-11-11T00:17:54.797Z"
  };
  XCTAssertThrows([ABI41_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database]);
}

@end
