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
    @"EXUpdatesURL": @"https://exp.host/@test/test",
    @"EXUpdatesUsesLegacyManifest": @(YES)
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
  NSDictionary *manifest = @{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };
  XCTAssert([EXUpdatesNewUpdate updateWithNewManifest:manifest config:_config database:_database] != nil);
}

- (void)testUpdateWithNewManifest_NoRuntimeVersion
{
  NSDictionary *manifest = @{
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest config:_config database:_database]);
}

- (void)testUpdateWithNewManifest_NoId
{
  NSDictionary *manifest = @{
    @"runtimeVersion": @"1",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest config:_config database:_database]);
}

- (void)testUpdateWithNewManifest_NoCreatedAt
{
  NSDictionary *manifest = @{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest config:_config database:_database]);
}

- (void)testUpdateWithNewManifest_NoLaunchAsset
{
  NSDictionary *manifest = @{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z"
  };
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest config:_config database:_database]);
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

  EXUpdatesUpdate *update1 = [EXUpdatesNewUpdate updateWithNewManifest:manifestNoRootLevelKeys config:_config database:_database];
  EXUpdatesUpdate *update2 = [EXUpdatesNewUpdate updateWithNewManifest:manifestWithRootLevelKeys config:_config database:_database];

  XCTAssert([update1.updateId isEqual:update2.updateId]);
}

@end
