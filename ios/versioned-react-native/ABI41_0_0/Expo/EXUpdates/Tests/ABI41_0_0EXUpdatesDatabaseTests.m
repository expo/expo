//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabase+Tests.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesNewUpdate.h>

@interface ABI41_0_0EXUpdatesDatabaseTests : XCTestCase

@property (nonatomic, strong) ABI41_0_0EXUpdatesDatabase *db;
@property (nonatomic, strong) NSURL *testDatabaseDir;
@property (nonatomic, strong) NSDictionary *manifest;
@property (nonatomic, strong) ABI41_0_0EXUpdatesConfig *config;

@end

@implementation ABI41_0_0EXUpdatesDatabaseTests

- (void)setUp
{
  NSURL *applicationSupportDir = [NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask].lastObject;
  _testDatabaseDir = [applicationSupportDir URLByAppendingPathComponent:@"ABI41_0_0EXUpdatesDatabaseTests"];
  if (![NSFileManager.defaultManager fileExistsAtPath:_testDatabaseDir.path]) {
    NSError *error;
    [NSFileManager.defaultManager createDirectoryAtPath:_testDatabaseDir.path withIntermediateDirectories:YES attributes:nil error:&error];
    XCTAssertNil(error);
  }

  _db = [[ABI41_0_0EXUpdatesDatabase alloc] init];
  dispatch_sync(_db.databaseQueue, ^{
    NSError *dbOpenError;
    [_db openDatabaseInDirectory:_testDatabaseDir withError:&dbOpenError];
    XCTAssertNil(dbOpenError);
  });

  _manifest = @{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  };
  _config = [ABI41_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI41_0_0EXUpdatesURL": @"https://exp.host/@test/test",
    @"ABI41_0_0EXUpdatesUsesLegacyManifest": @(NO)
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
  ABI41_0_0EXUpdatesUpdate *update = [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:nil config:_config database:_db];
  dispatch_sync(_db.databaseQueue, ^{
    NSError *updatesError;
    [_db addUpdate:update error:&updatesError];
    if (updatesError) {
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
  ABI41_0_0EXUpdatesUpdate *update1 = [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response1 config:_config database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);

  NSHTTPURLResponse *response2 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{
    @"expo-manifest-filters": @"branch-name=\"rollout-2\""
  }];
  ABI41_0_0EXUpdatesUpdate *update2 = [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response2 config:_config database:_db];
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
  ABI41_0_0EXUpdatesUpdate *update1 = [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response1 config:_config database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);
  
  NSHTTPURLResponse *response2 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{
    @"expo-manifest-filters": @""
  }];
  ABI41_0_0EXUpdatesUpdate *update2 = [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response2 config:_config database:_db];
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
  ABI41_0_0EXUpdatesUpdate *update1 = [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response1 config:_config database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);
  
  NSHTTPURLResponse *response2 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{}];
  ABI41_0_0EXUpdatesUpdate *update2 = [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response2 config:_config database:_db];
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

@end
