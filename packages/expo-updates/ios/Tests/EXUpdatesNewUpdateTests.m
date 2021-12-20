//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@interface EXUpdatesNewUpdateTests : XCTestCase

@property (nonatomic, strong) EXUpdatesConfig *config;
@property (nonatomic, strong) EXUpdatesDatabase *database;

@end

@implementation EXUpdatesNewUpdateTests

- (void)setUp
{
  _config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
  }];

  _database = [EXUpdatesDatabase new];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testUpdateWithNewManifest_AllFields
{
  // production manifests should require the id, createdAt, runtimeVersion, and launchAsset fields
  EXManifestsNewManifest *manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  XCTAssert([EXUpdatesNewUpdate updateWithNewManifest:manifest
                                      manifestHeaders:manifestHeaders
                                           extensions:@{}
                                               config:_config
                                             database:_database] != nil);
}

- (void)testUpdateWithNewManifest_NoRuntimeVersion
{
  EXManifestsNewManifest *manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest
                                            manifestHeaders:manifestHeaders
                                                 extensions:@{}
                                                     config:_config
                                                   database:_database]);
}

- (void)testUpdateWithNewManifest_NoId
{
  EXManifestsNewManifest *manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest
                                            manifestHeaders:manifestHeaders
                                                 extensions:@{}
                                                     config:_config
                                                   database:_database]);
}

- (void)testUpdateWithNewManifest_NoCreatedAt
{
  EXManifestsNewManifest *manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest
                                            manifestHeaders:manifestHeaders
                                                 extensions:@{}
                                                     config:_config
                                                   database:_database]);
}

- (void)testUpdateWithNewManifest_NoLaunchAsset
{
  EXManifestsNewManifest *manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z"
  }];
  EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest
                                            manifestHeaders:manifestHeaders
                                                 extensions:@{}
                                                     config:_config database:_database]);
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
  NSDictionary *actual = [EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_IgnoresOtherTypes
{
  NSString *header = @"branch-name=\"rollout-1\", data=:w4ZibGV0w6ZydGUK:, list=(1 2)";
  NSDictionary *expected = @{
    @"branch-name": @"rollout-1"
  };
  NSDictionary *actual = [EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_IgnoresParameters
{
  NSString *header = @"abc=123;a=1;b=2";
  NSDictionary *expected = @{
    @"abc": @(123)
  };
  NSDictionary *actual = [EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_Empty
{
  NSString *header = @"";
  NSDictionary *expected = @{};
  NSDictionary *actual = [EXUpdatesNewUpdate dictionaryWithStructuredHeader:header];
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDictionaryWithStructuredHeader_ParsingError
{
  NSString *header = @"bad dictionary";
  XCTAssertNil([EXUpdatesNewUpdate dictionaryWithStructuredHeader:header]);
}

@end
