//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesNewUpdate.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate.h>

@interface ABI41_0_0EXUpdatesNewUpdateTests : XCTestCase

@property (nonatomic, strong) ABI41_0_0EXUpdatesConfig *config;
@property (nonatomic, strong) ABI41_0_0EXUpdatesDatabase *database;

@end

@implementation ABI41_0_0EXUpdatesNewUpdateTests

- (void)setUp
{
  _config = [ABI41_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI41_0_0EXUpdatesURL": @"https://exp.host/@test/test",
    @"ABI41_0_0EXUpdatesUsesLegacyManifest": @(YES)
  }];

  _database = [ABI41_0_0EXUpdatesDatabase new];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testUpdateWithNewManifest_AllFields
{
  // production manifests should require the id, createdAt, runtimeVersion, and launchAsset fields
  NSDictionary *manifest = @{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };
  XCTAssert([ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest response:nil config:_config database:_database] != nil);
}

- (void)testUpdateWithNewManifest_NoRuntimeVersion
{
  NSDictionary *manifest = @{
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };
  XCTAssertThrows([ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest response:nil config:_config database:_database]);
}

- (void)testUpdateWithNewManifest_NoId
{
  NSDictionary *manifest = @{
    @"runtimeVersion": @"1",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };
  XCTAssertThrows([ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest response:nil config:_config database:_database]);
}

- (void)testUpdateWithNewManifest_NoCreatedAt
{
  NSDictionary *manifest = @{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };
  XCTAssertThrows([ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest response:nil config:_config database:_database]);
}

- (void)testUpdateWithNewManifest_NoLaunchAsset
{
  NSDictionary *manifest = @{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z"
  };
  XCTAssertThrows([ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest response:nil config:_config database:_database]);
}

- (void)testUpdateWithNewManifest_StripsOptionalRootLevelKeys
{
  NSDictionary *manifestNoRootLevelKeys = @{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };
  NSDictionary *manifestWithRootLevelKeys = @{
    @"manifest": manifestNoRootLevelKeys
  };

  ABI41_0_0EXUpdatesUpdate *update1 = [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:manifestNoRootLevelKeys response:nil config:_config database:_database];
  ABI41_0_0EXUpdatesUpdate *update2 = [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:manifestWithRootLevelKeys response:nil config:_config database:_database];

  XCTAssert([update1.updateId isEqual:update2.updateId]);
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
  NSDictionary *actual = [ABI41_0_0EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_IgnoresOtherTypes
{
  NSString *header = @"branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)";
  NSDictionary *expected = @{
    @"branch-name": @"rollout-1"
  };
  NSDictionary *actual = [ABI41_0_0EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_IgnoresParameters
{
  NSString *header = @"abc=123;a=1;b=2";
  NSDictionary *expected = @{
    @"abc": @(123)
  };
  NSDictionary *actual = [ABI41_0_0EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_Empty
{
  NSString *header = @"";
  NSDictionary *expected = @{};
  NSDictionary *actual = [ABI41_0_0EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_ParsingError
{
  NSString *header = @"bad dictionary";
  XCTAssertNil([ABI41_0_0EXUpdatesNewUpdate dictionaryWithStructuredHeader:header]);
}

@end
