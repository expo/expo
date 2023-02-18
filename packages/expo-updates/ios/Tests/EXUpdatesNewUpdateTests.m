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
  XCTAssert([EXUpdatesNewUpdate updateWithNewManifest:manifest
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
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest
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
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest
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
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest
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
  XCTAssertThrows([EXUpdatesNewUpdate updateWithNewManifest:manifest
                                                 extensions:@{}
                                                     config:_config database:_database]);
}

@end
