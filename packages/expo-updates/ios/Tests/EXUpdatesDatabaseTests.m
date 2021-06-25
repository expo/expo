//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase+Tests.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>

@interface EXUpdatesDatabaseTests : XCTestCase

@property (nonatomic, strong) EXUpdatesDatabase *db;
@property (nonatomic, strong) NSURL *testDatabaseDir;
@property (nonatomic, strong) EXUpdatesNewRawManifest *manifest;
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

  _manifest = [[EXUpdatesNewRawManifest alloc] initWithRawManifestJSON:@{
    @"runtimeVersion": @"1",
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"createdAt": @"2020-11-11T00:17:54.797Z",
    @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
  }];
  _config = [EXUpdatesConfig configWithDictionary:@{
    @"EXUpdatesURL": @"https://exp.host/@test/test",
    @"EXUpdatesUsesLegacyManifest": @(NO)
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
  EXUpdatesUpdate *update = [EXUpdatesNewUpdate updateWithNewManifest:_manifest response:nil config:_config database:_db];
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
  EXUpdatesUpdate *update1 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response1 config:_config database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);

  NSHTTPURLResponse *response2 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{
    @"expo-manifest-filters": @"branch-name=\"rollout-2\""
  }];
  EXUpdatesUpdate *update2 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response2 config:_config database:_db];
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
  EXUpdatesUpdate *update1 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response1 config:_config database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);
  
  NSHTTPURLResponse *response2 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{
    @"expo-manifest-filters": @""
  }];
  EXUpdatesUpdate *update2 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response2 config:_config database:_db];
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
  EXUpdatesUpdate *update1 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response1 config:_config database:_db];
  __block NSError *error1;
  dispatch_sync(_db.databaseQueue, ^{
    [_db setMetadataWithManifest:update1 error:&error1];
  });
  XCTAssertNil(error1);
  
  NSHTTPURLResponse *response2 = [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://exp.host/"] statusCode:200 HTTPVersion:@"HTTP/2" headerFields:@{}];
  EXUpdatesUpdate *update2 = [EXUpdatesNewUpdate updateWithNewManifest:_manifest response:response2 config:_config database:_db];
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
