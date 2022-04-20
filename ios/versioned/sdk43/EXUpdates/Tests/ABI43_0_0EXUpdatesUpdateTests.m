//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesBareUpdate.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesConfig.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesDatabase.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesLegacyUpdate.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesNewUpdate.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesUpdate.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesManifestHeaders.h>

@interface ABI43_0_0EXUpdatesUpdateTests : XCTestCase

@property (nonatomic, strong) NSDictionary *legacyManifest;
@property (nonatomic, strong) NSDictionary *easNewManifest;
@property (nonatomic, strong) NSDictionary *bareManifest;

@property (nonatomic, strong) ABI43_0_0EXUpdatesConfig *config;
@property (nonatomic, strong) ABI43_0_0EXUpdatesDatabase *database;

@end

@implementation ABI43_0_0EXUpdatesUpdateTests

- (void)setUp
{
  _legacyManifest = @{
    @"sdkVersion": @"39.0.0",
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @"2020-11-11T00:17:54.797Z",
    @"bundleUrl": @"https://url.to/bundle.js"
  };

  _easNewManifest = @{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };

  _bareManifest = @{
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @(1609975977832)
  };

  _config = [ABI43_0_0EXUpdatesConfig configWithDictionary:@{
    ABI43_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
  }];

  _database = [ABI43_0_0EXUpdatesDatabase new];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testUpdateWithManifest_Legacy
{
  NSError *error;
  ABI43_0_0EXUpdatesManifestHeaders *manifestHeaders = [[ABI43_0_0EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  ABI43_0_0EXUpdatesUpdate *update = [ABI43_0_0EXUpdatesUpdate updateWithManifest:_legacyManifest
                                                manifestHeaders:manifestHeaders
                                                     extensions:@{}
                                                         config:_config
                                                       database:_database
                                                          error:&error];
  XCTAssert(update != nil);
}

- (void)testUpdateWithManifest_New
{
  NSError *error;
  ABI43_0_0EXUpdatesManifestHeaders *manifestHeaders = [[ABI43_0_0EXUpdatesManifestHeaders alloc] initWithProtocolVersion:@"0"
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  ABI43_0_0EXUpdatesUpdate *update = [ABI43_0_0EXUpdatesUpdate updateWithManifest:_easNewManifest
                                                manifestHeaders:manifestHeaders
                                                     extensions:@{}
                                                         config:_config
                                                       database:_database
                                                          error:&error];
  XCTAssert(update != nil);
}

- (void)testUpdateWithManifest_UnsupportedProtocolVersion
{
  NSError *error;
  ABI43_0_0EXUpdatesManifestHeaders *manifestHeaders = [[ABI43_0_0EXUpdatesManifestHeaders alloc] initWithProtocolVersion:@"1"
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  ABI43_0_0EXUpdatesUpdate *update = [ABI43_0_0EXUpdatesUpdate updateWithManifest:_easNewManifest
                                                manifestHeaders:manifestHeaders
                                                     extensions:@{}
                                                         config:_config
                                                       database:_database
                                                          error:&error];
  XCTAssert(error != nil);
  XCTAssert(update == nil);
}

- (void)testUpdateWithEmbeddedManifest_Legacy
{
  ABI43_0_0EXUpdatesUpdate *update = [ABI43_0_0EXUpdatesUpdate updateWithEmbeddedManifest:_legacyManifest config:_config database:_database];
  XCTAssert(update != nil);
}

- (void)testUpdateWithEmbeddedManifest_Legacy_Bare
{
  ABI43_0_0EXUpdatesUpdate *update = [ABI43_0_0EXUpdatesUpdate updateWithEmbeddedManifest:_bareManifest config:_config database:_database];
  XCTAssert(update != nil);
}

@end
