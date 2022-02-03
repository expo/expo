//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesLegacyUpdate.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@interface EXUpdatesLegacyUpdateTests : XCTestCase

@property (nonatomic, strong) EXUpdatesConfig *config;
@property (nonatomic, strong) EXUpdatesConfig *selfHostedConfig;
@property (nonatomic, strong) EXUpdatesDatabase *database;

@end

@implementation EXUpdatesLegacyUpdateTests

- (void)setUp
{
  _config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
  }];

  _selfHostedConfig = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://esamelson.github.io/self-hosting-test/ios-index.json",
    EXUpdatesConfigSDKVersionKey: @"38.0.0"
  }];

  _database = [EXUpdatesDatabase new];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testBundledAssetBaseUrl_ExpoDomain
{
  EXManifestsLegacyManifest *manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{}];
  NSURL *expected = [NSURL URLWithString:@"https://classic-assets.eascdn.net/~assets/"];
  XCTAssert([expected isEqual:[EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:manifest config:[EXUpdatesConfig configWithDictionary:@{EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test"}]]]);
  XCTAssert([expected isEqual:[EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:manifest config:[EXUpdatesConfig configWithDictionary:@{EXUpdatesConfigUpdateUrlKey: @"https://expo.io/@test/test"}]]]);
  XCTAssert([expected isEqual:[EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:manifest config:[EXUpdatesConfig configWithDictionary:@{EXUpdatesConfigUpdateUrlKey: @"https://expo.test/@test/test"}]]]);
}

- (void)testBundledAssetBaseUrl_ExpoSubdomain
{
  EXManifestsLegacyManifest *manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{}];
  NSURL *expected = [NSURL URLWithString:@"https://classic-assets.eascdn.net/~assets/"];
  XCTAssert([expected isEqual:[EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:manifest config:[EXUpdatesConfig configWithDictionary:@{EXUpdatesConfigUpdateUrlKey: @"https://staging.exp.host/@test/test"}]]]);
  XCTAssert([expected isEqual:[EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:manifest config:[EXUpdatesConfig configWithDictionary:@{EXUpdatesConfigUpdateUrlKey: @"https://staging.expo.io/@test/test"}]]]);
  XCTAssert([expected isEqual:[EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:manifest config:[EXUpdatesConfig configWithDictionary:@{EXUpdatesConfigUpdateUrlKey: @"https://staging.expo.test/@test/test"}]]]);
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_AbsoluteUrl
{
  NSString *absoluteUrlString = @"https://xxx.dev/~assets";
  NSURL *absoluteExpected = [NSURL URLWithString:absoluteUrlString];
  NSURL *absoluteActual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:[[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{ @"assetUrlOverride": absoluteUrlString }] config:_selfHostedConfig];
  XCTAssert([absoluteActual isEqual:absoluteExpected], @"should return the value of assetUrlOverride if it's an absolute URL");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_RelativeUrl
{
  NSURL *relativeExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/my_assets"];
  NSURL *relativeActual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:[[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{ @"assetUrlOverride": @"my_assets" }] config:_selfHostedConfig];
  XCTAssert([relativeActual isEqual:relativeExpected], @"should return a URL relative to manifest URL base if it's a relative URL");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_OriginRelativeUrl
{
  NSURL *originRelativeExpected = [NSURL URLWithString:@"https://esamelson.github.io/my_assets"];
  NSURL *originRelativeActual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:[[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{ @"assetUrlOverride": @"/my_assets" }] config:_selfHostedConfig];
  XCTAssert([originRelativeActual isEqual:originRelativeExpected], @"should return a URL relative to manifest URL base if it's an origin-relative URL");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_RelativeUrlDotSlash
{
  NSURL *relativeDotSlashExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/my_assets"];
  NSURL *relativeDotSlashActual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:[[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{ @"assetUrlOverride": @"./my_assets" }] config:_selfHostedConfig];
  XCTAssert([relativeDotSlashActual isEqual:relativeDotSlashExpected], @"should return a URL relative to manifest URL base with `./` resolved correctly if it's a relative URL");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_Normalize
{
  NSURL *expected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/b"];
  NSURL *actual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:[[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{ @"assetUrlOverride": @"./a/../b" }] config:_selfHostedConfig];
  XCTAssert([actual isEqual:expected], @"should return a correctly normalized URL relative to manifest URL base");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_NormalizeToHostname
{
  NSURL *expected = [NSURL URLWithString:@"https://esamelson.github.io/b"];
  NSURL *actual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:[[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{ @"assetUrlOverride": @"../b" }] config:_selfHostedConfig];
  XCTAssert([actual isEqual:expected], @"should return a correctly normalized URL relative to manifest URL base if the relative path goes back to the hostname");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_NormalizePastHostname
{
  NSURL *expected = [NSURL URLWithString:@"https://esamelson.github.io/b"];
  NSURL *actual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:[[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{ @"assetUrlOverride": @"../../b" }] config:_selfHostedConfig];
  XCTAssert([actual isEqual:expected], @"should return a correctly normalized URL relative to manifest URL base if the relative path goes back past the hostname");
}

- (void)testBundledAssetBaseUrl_AssetUrlOverride_Default
{
  NSURL *defaultExpected = [NSURL URLWithString:@"https://esamelson.github.io/self-hosting-test/assets"];
  NSURL *defaultActual = [EXUpdatesLegacyUpdate bundledAssetBaseUrlWithManifest:[[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{}] config:_selfHostedConfig];
  XCTAssert([defaultActual isEqual:defaultExpected], @"should return a URL with `assets` relative to manifest URL base if unspecified");
}

- (void)testUpdateWithLegacyManifest_Development
{
  // manifests served from a developer tool should not need the releaseId and commitTime fields
  EXManifestsLegacyManifest *manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{
    @"sdkVersion": @"39.0.0",
    @"bundleUrl": @"https://url.to/bundle.js",
    @"developer": @{@"tool": @"expo-cli"}
  }];
  XCTAssert([EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database] != nil);
}

- (void)testUpdateWithLegacyManifest_Production_AllFields
{
  // production manifests should require the releaseId, commitTime, sdkVersion, and bundleUrl fields
  EXManifestsLegacyManifest *manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{
    @"sdkVersion": @"39.0.0",
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @"2020-11-11T00:17:54.797Z",
    @"bundleUrl": @"https://url.to/bundle.js"
  }];
  XCTAssert([EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database] != nil);
}

- (void)testUpdateWithLegacyManifest_Production_NoSdkVersion
{
  EXManifestsLegacyManifest *manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @"2020-11-11T00:17:54.797Z",
    @"bundleUrl": @"https://url.to/bundle.js"
  }];
  XCTAssertThrows([EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database]);
}

- (void)testUpdateWithLegacyManifest_Production_NoReleaseId
{
  EXManifestsLegacyManifest *manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{
    @"sdkVersion": @"39.0.0",
    @"commitTime": @"2020-11-11T00:17:54.797Z",
    @"bundleUrl": @"https://url.to/bundle.js"
  }];
  XCTAssertThrows([EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database]);
}

- (void)testUpdateWithLegacyManifest_Production_NoCommitTime
{
  EXManifestsLegacyManifest *manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{
    @"sdkVersion": @"39.0.0",
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"bundleUrl": @"https://url.to/bundle.js"
  }];
  XCTAssertThrows([EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database]);
}

- (void)testUpdateWithLegacyManifest_Production_NoBundleUrl
{
  EXManifestsLegacyManifest *manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{
    @"sdkVersion": @"39.0.0",
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @"2020-11-11T00:17:54.797Z"
  }];
  XCTAssertThrows([EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database]);
}

- (void)testUpdateWithLegacyManifest_setsUpdateRuntimeAsSdkIfNoManifestRuntime
{
  NSString *sdkVersion = @"39.0.0";
  EXManifestsLegacyManifest *manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{
    @"sdkVersion": sdkVersion,
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"bundleUrl": @"https://url.to/bundle.js",
    @"commitTime": @"2020-11-11T00:17:54.797Z"
  }];

  EXUpdatesUpdate *update = [EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database];

  XCTAssertEqualObjects(sdkVersion, update.runtimeVersion);
}

- (void)testUpdateWithLegacyManifest_setsUpdateRuntimeAsRuntimeIfBothManifestRuntime
{
  NSString *sdkVersion = @"39.0.0";
  NSString *runtimeVersion = @"hello";
  EXManifestsLegacyManifest *manifest = [[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": runtimeVersion,
    @"sdkVersion": sdkVersion,
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"bundleUrl": @"https://url.to/bundle.js",
    @"commitTime": @"2020-11-11T00:17:54.797Z"
  }];

  EXUpdatesUpdate *update = [EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest config:_config database:_database];

  XCTAssertEqualObjects(runtimeVersion, update.runtimeVersion);
}

@end
