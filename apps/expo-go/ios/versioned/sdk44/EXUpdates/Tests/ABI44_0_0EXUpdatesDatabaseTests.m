//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsNewManifest.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAsset.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesConfig.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDatabase+Tests.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesNewUpdate.h>

@interface ABI44_0_0EXUpdatesDatabaseTests : XCTestCase

@property (nonatomic, strong) ABI44_0_0EXUpdatesDatabase *db;
@property (nonatomic, strong) NSURL *testDatabaseDir;
@property (nonatomic, strong) ABI44_0_0EXManifestsNewManifest *manifest;
@property (nonatomic, strong) ABI44_0_0EXUpdatesConfig *config;

@end

@implementation ABI44_0_0EXUpdatesDatabaseTests

- (void)setUp
{
  NSURL *applicationSupportDir = [NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask].lastObject;
  _testDatabaseDir = [applicationSupportDir URLByAppendingPathComponent:@"ABI44_0_0EXUpdatesDatabaseTests"];
  if (![NSFileManager.defaultManager fileExistsAtPath:_testDatabaseDir.path]) {
    NSError *error;
    [NSFileManager.defaultManager createDirectoryAtPath:_testDatabaseDir.path withIntermediateDirectories:YES attributes:nil error:&error];
    XCTAssertNil(error);
  }

  _db = [[ABI44_0_0EXUpdatesDatabase alloc] init];
  dispatch_sync(_db.databaseQueue, ^{
    NSError *dbOpenError;
    [_db openDatabaseInDirectory:_testDatabaseDir withError:&dbOpenError];
    XCTAssertNil(dbOpenError);
  });

  _manifest = [[ABI44_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  _config = [ABI44_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI44_0_0EXUpdatesURL": @"https://exp.host/@test/test",
    @"ABI44_0_0EXUpdatesUsesLegacyManifest": @(NO)
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
  ABI44_0_0EXUpdatesUpdate *update = [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:nil config:_config database:_db];
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
  NSHTTPURLResponse *response1 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{
    @"expo-manifest-filters": @"branch-name=\"rollout-1\",test=\"value\""
  }];
  ABI44_0_0EXUpdatesUpdate *update1 = [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response1 config:_config database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);

  NSHTTPURLResponse *response2 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{
    @"expo-manifest-filters": @"branch-name=\"rollout-2\""
  }];
  ABI44_0_0EXUpdatesUpdate *update2 = [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response2 config:_config database:_db];
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
  NSHTTPURLResponse *response1 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{
    @"expo-manifest-filters": @"branch-name=\"rollout-1\""
  }];
  ABI44_0_0EXUpdatesUpdate *update1 = [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response1 config:_config database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);

  NSHTTPURLResponse *response2 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{
    @"expo-manifest-filters": @""
  }];
  ABI44_0_0EXUpdatesUpdate *update2 = [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response2 config:_config database:_db];
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
  NSHTTPURLResponse *response1 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{
    @"expo-manifest-filters": @"branch-name=\"rollout-1\""
  }];
  ABI44_0_0EXUpdatesUpdate *update1 = [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response1 config:_config database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);

  NSHTTPURLResponse *response2 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{}];
  ABI44_0_0EXUpdatesUpdate *update2 = [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response2 config:_config database:_db];
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
  ABI44_0_0EXManifestsNewManifest *manifest1 = [[ABI44_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle1.js", @"contentType": @"application/javascript"}
  }];
  ABI44_0_0EXManifestsNewManifest *manifest2 = [[ABI44_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f197",
    @"createdAt": @"2020-11-11T00:17:55.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle2.js", @"contentType": @"application/javascript"}
  }];

  ABI44_0_0EXUpdatesAsset *asset1 = [self createMockAssetWithKey:@"key1"];
  ABI44_0_0EXUpdatesAsset *asset2 = [self createMockAssetWithKey:@"key2"];
  ABI44_0_0EXUpdatesAsset *asset3 = [self createMockAssetWithKey:@"key3"];

  // simulate two assets with different keys that share a file on disk
  // this can happen if we, for example, change the format of asset keys that we serve
  asset2.filename = @"same-filename.png";
  asset3.filename = @"same-filename.png";

  ABI44_0_0EXUpdatesUpdate *update1 = [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest1 response:nil config:_config database:_db];
  ABI44_0_0EXUpdatesUpdate *update2 = [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest2 response:nil config:_config database:_db];

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

    NSArray<ABI44_0_0EXUpdatesAsset *> *assets = [_db allAssetsWithError:nil];
    XCTAssertEqual(3, assets.count); // two bundles and asset1 and asset2

    NSError *deleteAssetsError;
    NSArray<ABI44_0_0EXUpdatesAsset *> *deletedAssets = [_db deleteUnusedAssetsWithError:&deleteAssetsError];
    if (deleteAssetsError) {
      XCTFail(@"%@", deleteAssetsError.localizedDescription);
      return;
    }

    // asset1 should have been deleted, but asset2 should have been kept
    // since it shared a filename with asset3, which is still in use
    XCTAssertEqual(1, deletedAssets.count);
    for (ABI44_0_0EXUpdatesAsset *deletedAsset in deletedAssets) {
      XCTAssertEqualObjects(@"key1", deletedAsset.key);
    }

    XCTAssertNil([_db assetWithKey:@"key1" error:nil]);
    XCTAssertNotNil([_db assetWithKey:@"key2" error:nil]);
    XCTAssertNotNil([_db assetWithKey:@"key3" error:nil]);
  });
}

- (ABI44_0_0EXUpdatesAsset *)createMockAssetWithKey:(NSString *)key
{
  ABI44_0_0EXUpdatesAsset *asset = [[ABI44_0_0EXUpdatesAsset alloc] initWithKey:key type:@"png"];
  asset.downloadTime = [NSDate date];
  asset.contentHash = key;
  asset.filename = [NSString stringWithFormat:@"%@.png", key];
  return asset;
}

@end
