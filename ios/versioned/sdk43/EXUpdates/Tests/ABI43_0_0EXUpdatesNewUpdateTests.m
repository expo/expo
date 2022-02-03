//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesConfig.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesDatabase.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesNewUpdate.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesUpdate.h>

@interface ABI43_0_0EXUpdatesNewUpdateTests : XCTestCase

@property (nonatomic, strong) ABI43_0_0EXUpdatesConfig *config;
@property (nonatomic, strong) ABI43_0_0EXUpdatesDatabase *database;

@end

@implementation ABI43_0_0EXUpdatesNewUpdateTests

- (void)setUp
{
  _config = [ABI43_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI43_0_0EXUpdatesURL": @"https://exp.host/@test/test",
    @"ABI43_0_0EXUpdatesUsesLegacyManifest": @(YES)
  }];

  _database = [ABI43_0_0EXUpdatesDatabase new];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testUpdateWithNewManifest_AllFields
{
  // production manifests should require the id, createdAt, runtimeVersion, and launchAsset fields
  ABI43_0_0EXManifestsNewManifest *manifest = [[ABI43_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  XCTAssert([ABI43_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest response:nil config:_config database:_database] != nil);
}

- (void)testUpdateWithNewManifest_NoRuntimeVersion
{
  ABI43_0_0EXManifestsNewManifest *manifest = [[ABI43_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  XCTAssertThrows([ABI43_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest response:nil config:_config database:_database]);
}

- (void)testUpdateWithNewManifest_NoId
{
  ABI43_0_0EXManifestsNewManifest *manifest = [[ABI43_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  XCTAssertThrows([ABI43_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest response:nil config:_config database:_database]);
}

- (void)testUpdateWithNewManifest_NoCreatedAt
{
  ABI43_0_0EXManifestsNewManifest *manifest = [[ABI43_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  XCTAssertThrows([ABI43_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest response:nil config:_config database:_database]);
}

- (void)testUpdateWithNewManifest_NoLaunchAsset
{
  ABI43_0_0EXManifestsNewManifest *manifest = [[ABI43_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z"
  }];
  XCTAssertThrows([ABI43_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest response:nil config:_config database:_database]);
}

- (void)testDictionaryWithStructuredHeader_SupportedTypes
{
  NSString *header = @"string=\"string-0000\", true=?1, false=?0, integer=47, decimal=47.5";
  NSDictionary *expected = @{
    @"string": @"string-0000",
    @"true": @(YES),
    @"false": @(NO),
    @"integer": @(47),
    @"decimal": @(47.5)
  };
  NSDictionary *actual = [ABI43_0_0EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_IgnoresOtherTypes
{
  NSString *header = @"branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)";
  NSDictionary *expected = @{
    @"branch-name": @"rollout-1"
  };
  NSDictionary *actual = [ABI43_0_0EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_IgnoresParameters
{
  NSString *header = @"abc=123;a=1;b=2";
  NSDictionary *expected = @{
    @"abc": @(123)
  };
  NSDictionary *actual = [ABI43_0_0EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_Empty
{
  NSString *header = @"";
  NSDictionary *expected = @{};
  NSDictionary *actual = [ABI43_0_0EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_ParsingError
{
  NSString *header = @"bad dictionary";
  XCTAssertNil([ABI43_0_0EXUpdatesNewUpdate dictionaryWithStructuredHeader:header]);
}

@end
