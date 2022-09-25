//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXManifests/EXManifestsNewManifest.h>
#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase+Tests.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>

@interface EXUpdatesDatabaseTests : XCTestCase

@property (nonatomic, strong) EXUpdatesDatabase *db;
@property (nonatomic, strong) NSURL *testDatabaseDir;
@property (nonatomic, strong) EXManifestsNewManifest *manifest;
@property (nonatomic, strong) EXUpdatesConfig *config;

@end

@implementation EXUpdatesDatabaseTests

- (void)setUp
{
  NSURL *applicationSupportDir = [NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask].lastObject;
  _testDatabaseDir = [applicationSupportDir URLByAppendingPathComponent:@"EXUpdatesDatabaseTests"];
  if (![NSFileManager.defaultManager fileExistsAtPath:_testDatabaseDir.path]) {
    NSError *error;
    [NSFileManager.defaultManager createDirectoryAtPath:_testDatabaseDir.path withIntermediateDirectories:YES attributes:nil error:&error];
    XCTAssertNil(error);
  }

  _db = [[EXUpdatesDatabase alloc] init];
  dispatch_sync(_db.databaseQueue, ^{
    NSError *dbOpenError;
    [_db openDatabaseInDirectory:_testDatabaseDir withError:&dbOpenError];
    XCTAssertNil(dbOpenError);
  });

  _manifest = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  _config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
  }];
}

- (void)tearDown
{
  dispatch_sync(_db.databaseQueue, ^{
    [_db closeDatabase];
  });
  NSError *error;
  [NSFileManager.defaultManager removeItemAtPath:_testDatabaseDir.path error:&error];
  XCTAssertNil(error);
}

- (void)testForeignKeys
{
  __block NSError *expectedError;
  EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  EXUpdatesUpdate *update = [EXUpdatesNewUpdate updateWithNewManifest:_manifest
                                                      manifestHeaders:manifestHeaders
                                                           extensions:@{}
                                                               config:_config database:_db];
  dispatch_sync(_db.databaseQueue, ^{
    NSError *updatesError;
    [_db addUpdate:update error:&updatesError];
    if (updatesError) {
      XCTFail(@"%@", updatesError.localizedDescription);
      return;
    }

    NSError *updatesAssetsError;
    [_db _executeSql:@"INSERT OR REPLACE INTO updates_assets (\"update_id\", \"asset_id\") VALUES (?1, ?2)" withArgs:@[update.updateId, @(47)] error:&updatesAssetsError];
    expectedError = updatesAssetsError;
  });
  XCTAssertNotNil(expectedError);
  XCTAssertEqual(787, expectedError.code); // SQLITE_CONSTRAINT_FOREIGNKEY
}

- (void)testSetMetadata_OverwriteAllFields
{
  EXUpdatesManifestHeaders *manifestHeaders1 = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:@"branch-name=\"rollout-1\",test=\"value\""
                                                                                      manifestSignature:nil
                                                                                               signature:nil];
  EXUpdatesUpdate *update1 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest
                                                       manifestHeaders:manifestHeaders1
                                                            extensions:@{}
                                                                config:_config
                                                              database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);

  EXUpdatesManifestHeaders *manifestHeaders2 = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:@"branch-name=\"rollout-2\""
                                                                                      manifestSignature:nil
                                                                                               signature:nil];
  EXUpdatesUpdate *update2 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest
                                                       manifestHeaders:manifestHeaders2
                                                            extensions:@{}
                                                                config:_config
                                                              database:_db];
  __block NSError *error2;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update2 error:&error2];
  });
  XCTAssertNil(error2);

  NSDictionary *expected = @{@"branch-name": @"rollout-2"};
  __block NSDictionary *actual;
  __block NSError *readError;
  dispatch_sync(_db.databaseQueue, ^{
    actual = [_db manifestFiltersWithScopeKey:update2.scopeKey error:&readError];
  });
  XCTAssertNil(readError);
  XCTAssertNotNil(actual);
  XCTAssertEqualObjects(expected, actual);
}

- (void)testSetMetadata_OverwriteEmpty
{
  EXUpdatesManifestHeaders *manifestHeaders1 = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:@"branch-name=\"rollout-1\""
                                                                                      manifestSignature:nil
                                                                                               signature:nil];
  EXUpdatesUpdate *update1 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest
                                                       manifestHeaders:manifestHeaders1
                                                            extensions:@{}
                                                                config:_config
                                                              database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);

  EXUpdatesManifestHeaders *manifestHeaders2 = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:@""
                                                                                      manifestSignature:nil
                                                                                               signature:nil];
  EXUpdatesUpdate *update2 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest
                                                       manifestHeaders:manifestHeaders2
                                                            extensions:@{}
                                                                config:_config
                                                              database:_db];
  __block NSError *error2;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update2 error:&error2];
  });
  XCTAssertNil(error2);

  NSDictionary *expected = @{};
  __block NSDictionary *actual;
  __block NSError *readError;
  dispatch_sync(_db.databaseQueue, ^{
    actual = [_db manifestFiltersWithScopeKey:update2.scopeKey error:&readError];
  });
  XCTAssertNil(readError);
  XCTAssertNotNil(actual);
  XCTAssertEqualObjects(expected, actual);
}

- (void)testSetMetadata_OverwriteNull
{
  EXUpdatesManifestHeaders *manifestHeaders1 = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:@"branch-name=\"rollout-1\""
                                                                                      manifestSignature:nil
                                                                                               signature:nil];
  EXUpdatesUpdate *update1 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest
                                                       manifestHeaders:manifestHeaders1
                                                            extensions:@{}
                                                                config:_config
                                                              database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);

  EXUpdatesManifestHeaders *manifestHeaders2 = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                               signature:nil];
  EXUpdatesUpdate *update2 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest
                                                       manifestHeaders:manifestHeaders2
                                                            extensions:@{}
                                                                config:_config
                                                              database:_db];
  __block NSError *error2;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update2 error:&error2];
  });
  XCTAssertNil(error2);

  NSDictionary *expected = @{@"branch-name": @"rollout-1"};
  __block NSDictionary *actual;
  __block NSError *readError;
  dispatch_sync(_db.databaseQueue, ^{
    actual = [_db manifestFiltersWithScopeKey:update2.scopeKey error:&readError];
  });
  XCTAssertNil(readError);
  XCTAssertNotNil(actual);
  XCTAssertEqualObjects(expected, actual);
}

- (void)testDeleteUnusedAssets_DuplicateFilenames
{
  EXManifestsNewManifest *manifest1 = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle1.js", @"contentType": @"application/javascript"}
  }];
  EXManifestsNewManifest *manifest2 = [[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f197",
    @"createdAt": @"2020-11-11T00:17:55.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle2.js", @"contentType": @"application/javascript"}
  }];

  EXUpdatesAsset *asset1 = [self createMockAssetWithKey:@"key1"];
  EXUpdatesAsset *asset2 = [self createMockAssetWithKey:@"key2"];
  EXUpdatesAsset *asset3 = [self createMockAssetWithKey:@"key3"];

  // simulate two assets with different keys that share a file on disk
  // this can happen if we, for example, change the format of asset keys that we serve
  asset2.filename = @"same-filename.png";
  asset3.filename = @"same-filename.png";

  EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];
  EXUpdatesUpdate *update1 = [EXUpdatesNewUpdate updateWithNewManifest:manifest1
                                                       manifestHeaders:manifestHeaders
                                                            extensions:@{}
                                                                config:_config
                                                              database:_db];
  EXUpdatesUpdate *update2 = [EXUpdatesNewUpdate updateWithNewManifest:manifest2
                                                       manifestHeaders:manifestHeaders
                                                            extensions:@{}
                                                                config:_config
                                                              database:_db];

  dispatch_sync(_db.databaseQueue, ^{
    NSError *update1Error;
    [_db addUpdate:update1 error:&update1Error];
    NSError *update2Error;
    [_db addUpdate:update2 error:&update2Error];
    NSError *updateAsset1Error;
    [_db addNewAssets:@[asset1, asset2] toUpdateWithId:update1.updateId error:&updateAsset1Error];
    NSError *updateAsset2Error;
    [_db addNewAssets:@[asset3] toUpdateWithId:update2.updateId error:&updateAsset2Error];
    if (update1Error || update2Error || updateAsset1Error || updateAsset2Error) {
      XCTFail(@"%@ %@ %@ %@", update1Error.localizedDescription, update2Error.localizedDescription, updateAsset1Error.localizedDescription, updateAsset2Error.localizedDescription);
      return;
    }

    // simulate update1 being reaped, update2 being kept
    NSError *deleteUpdateError;
    [_db deleteUpdates:@[update1] error:&deleteUpdateError];
    if (deleteUpdateError) {
      XCTFail(@"%@", deleteUpdateError.localizedDescription);
      return;
    }

    NSArray<EXUpdatesAsset *> *assets = [_db allAssetsWithError:nil];
    XCTAssertEqual(3, assets.count); // two bundles and asset1 and asset2

    NSError *deleteAssetsError;
    NSArray<EXUpdatesAsset *> *deletedAssets = [_db deleteUnusedAssetsWithError:&deleteAssetsError];
    if (deleteAssetsError) {
      XCTFail(@"%@", deleteAssetsError.localizedDescription);
      return;
    }

    // asset1 should have been deleted, but asset2 should have been kept
    // since it shared a filename with asset3, which is still in use
    XCTAssertEqual(1, deletedAssets.count);
    for (EXUpdatesAsset *deletedAsset in deletedAssets) {
      XCTAssertEqualObjects(@"key1", deletedAsset.key);
    }

    XCTAssertNil([_db assetWithKey:@"key1" error:nil]);
    XCTAssertNotNil([_db assetWithKey:@"key2" error:nil]);
    XCTAssertNotNil([_db assetWithKey:@"key3" error:nil]);
  });
}

- (EXUpdatesAsset *)createMockAssetWithKey:(NSString *)key
{
  EXUpdatesAsset *asset = [[EXUpdatesAsset alloc] initWithKey:key type:@"png"];
  asset.downloadTime = [NSDate date];
  asset.contentHash = key;
  asset.filename = [NSString stringWithFormat:@"%@.png", key];
  return asset;
}

@end
