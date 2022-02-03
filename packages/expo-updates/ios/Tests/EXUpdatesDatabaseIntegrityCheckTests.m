//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesAsset.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesDatabaseIntegrityCheck.h>
#import <EXUpdates/EXUpdatesUpdate.h>
#import <EXUpdates/EXUpdatesUtils.h>

/**
 * special test implementation of this class that will mock the situation
 * where asset1 exists on disk but asset2 does not
 */
@interface EXUpdatesDatabaseIntegrityCheckMockingAssetExists : EXUpdatesDatabaseIntegrityCheck

@end

@implementation EXUpdatesDatabaseIntegrityCheckMockingAssetExists

+ (BOOL)asset:(EXUpdatesAsset *)asset existsInDirectory:(NSURL *)directory
{
  return [@"asset1" isEqualToString:asset.key];
}

@end

@interface EXUpdatesDatabaseIntegrityCheckTests : XCTestCase

@property (nonatomic, strong) EXUpdatesDatabase *db;
@property (nonatomic, strong) NSURL *testDatabaseDir;

@end

@implementation EXUpdatesDatabaseIntegrityCheckTests

- (void)setUp
{
  NSURL *applicationSupportDir = [NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask].lastObject;
  _testDatabaseDir = [applicationSupportDir URLByAppendingPathComponent:@"EXUpdatesDatabaseTests"];
  if ([NSFileManager.defaultManager fileExistsAtPath:_testDatabaseDir.path]) {
    NSError *error;
    [NSFileManager.defaultManager removeItemAtPath:_testDatabaseDir.path error:&error];
    XCTAssertNil(error);
  }
  NSError *error;
  [NSFileManager.defaultManager createDirectoryAtPath:_testDatabaseDir.path withIntermediateDirectories:YES attributes:nil error:&error];
  XCTAssertNil(error);

  _db = [[EXUpdatesDatabase alloc] init];
  dispatch_sync(_db.databaseQueue, ^{
    NSError *dbOpenError;
    [_db openDatabaseInDirectory:_testDatabaseDir withError:&dbOpenError];
    XCTAssertNil(dbOpenError);
  });
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

- (void)testFilterEmbeddedUpdates
{
  // We can't run any updates with the status EMBEDDED if they aren't the update that's
  // currently embedded in the installed app; the integrity check should remove any such updates
  // from the database entirely.

  NSString *scopeKey = @"testScopeKey";
  NSString *runtimeVersion = @"1.0";
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigScopeKeyKey: scopeKey,
    EXUpdatesConfigRuntimeVersionKey: runtimeVersion
  }];
  EXUpdatesUpdate *update1 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667851] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:_db];
  EXUpdatesUpdate *update2 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667852] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:_db];

  update1.status = EXUpdatesUpdateStatusEmbedded;
  update2.status = EXUpdatesUpdateStatusEmbedded;

  dispatch_sync(_db.databaseQueue, ^{
    NSError *error1;
    [_db addUpdate:update1 error:&error1];
    XCTAssertNil(error1);
    NSError *error2;
    [_db addUpdate:update2 error:&error2];
    XCTAssertNil(error2);

    XCTAssertEqual(2, [_db allUpdatesWithConfig:config error:nil].count);

    NSError *error3;
    [EXUpdatesDatabaseIntegrityCheck runWithDatabase:_db directory:_testDatabaseDir config:config embeddedUpdate:update2 error:&error3];
    XCTAssertNil(error3);

    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:config error:nil];
    XCTAssertEqual(1, allUpdates.count);
    XCTAssertEqualObjects(update2.updateId, allUpdates[0].updateId);
  });
}

- (void)testMissingAssets
{
  EXUpdatesAsset *asset1 = [[EXUpdatesAsset alloc] initWithKey:@"asset1" type:@"png"];
  asset1.downloadTime = [NSDate date];
  asset1.contentHash = @"hash1";
  EXUpdatesAsset *asset2 = [[EXUpdatesAsset alloc] initWithKey:@"asset2" type:@"png"];
  asset2.downloadTime = [NSDate date];
  asset2.contentHash = @"hash2";

  NSString *scopeKey = @"testScopeKey";
  NSString *runtimeVersion = @"1.0";
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigScopeKeyKey: scopeKey,
    EXUpdatesConfigRuntimeVersionKey: runtimeVersion
  }];
  EXUpdatesUpdate *update1 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667851] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:_db];
  EXUpdatesUpdate *update2 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667852] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:_db];

  update1.status = EXUpdatesUpdateStatusReady;
  update2.status = EXUpdatesUpdateStatusReady;

  dispatch_sync(_db.databaseQueue, ^{
    NSError *error1;
    [_db addUpdate:update1 error:&error1];
    XCTAssertNil(error1);
    NSError *error2;
    [_db addUpdate:update2 error:&error2];
    XCTAssertNil(error2);
    NSError *error3;
    [_db addNewAssets:@[asset1] toUpdateWithId:update1.updateId error:&error3];
    XCTAssertNil(error3);
    NSError *error4;
    [_db addNewAssets:@[asset2] toUpdateWithId:update2.updateId error:&error4];
    XCTAssertNil(error4);

    XCTAssertEqual(2, [_db allUpdatesWithConfig:config error:nil].count);
    XCTAssertEqual(2, [_db allAssetsWithError:nil].count);

    NSError *error5;
    [EXUpdatesDatabaseIntegrityCheckMockingAssetExists runWithDatabase:_db directory:_testDatabaseDir config:config embeddedUpdate:nil error:&error5];
    XCTAssertNil(error5);

    NSArray<EXUpdatesUpdate *> *allUpdates = [_db allUpdatesWithConfig:config error:nil];
    NSArray<EXUpdatesAsset *> *allAssets = [_db allAssetsWithError:nil];
    XCTAssertEqual(2, allUpdates.count);
    XCTAssertEqual(2, allAssets.count);

    NSArray<EXUpdatesUpdate *> *sortedUpdates = [allUpdates sortedArrayUsingDescriptors:@[[NSSortDescriptor sortDescriptorWithKey:@"commitTime" ascending:YES]]];
    XCTAssertEqual(EXUpdatesUpdateStatusReady, sortedUpdates[0].status);
    XCTAssertEqual(EXUpdatesUpdateStatusPending, sortedUpdates[1].status);
  });
}

@end
