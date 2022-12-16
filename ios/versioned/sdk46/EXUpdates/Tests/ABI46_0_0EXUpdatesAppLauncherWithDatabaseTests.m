//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesAppLauncherWithDatabase+Tests.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesConfig.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesDatabase.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesSelectionPolicy.h>

@interface ABI46_0_0EXUpdatesAppLauncherWithDatabaseMock : ABI46_0_0EXUpdatesAppLauncherWithDatabase

+ (ABI46_0_0EXUpdatesUpdate *)testUpdate;

@end

@implementation ABI46_0_0EXUpdatesAppLauncherWithDatabaseMock

+ (ABI46_0_0EXUpdatesUpdate *)testUpdate
{
  static ABI46_0_0EXUpdatesUpdate *theUpdate;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theUpdate) {
      NSString *runtimeVersion = @"1.0";
      NSString *scopeKey = @"dummyScope";
      ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig new];
      ABI46_0_0EXUpdatesDatabase *database = [ABI46_0_0EXUpdatesDatabase new];
      theUpdate = [ABI46_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667851] runtimeVersion:runtimeVersion manifest:nil status:ABI46_0_0EXUpdatesUpdateStatusReady keep:YES config:config database:database];
    }
  });
  return theUpdate;
}

+ (void)launchableUpdateWithConfig:(ABI46_0_0EXUpdatesConfig *)config
                          database:(ABI46_0_0EXUpdatesDatabase *)database
                   selectionPolicy:(ABI46_0_0EXUpdatesSelectionPolicy *)selectionPolicy
                        completion:(ABI46_0_0EXUpdatesAppLauncherUpdateCompletionBlock)completion
                   completionQueue:(dispatch_queue_t)completionQueue
{
  completion(nil, [[self class] testUpdate]);
}

- (void)_ensureAllAssetsExist
{
  dispatch_async(self.completionQueue, ^{
    self.completion(nil, YES);
  });
}

@end

@interface ABI46_0_0EXUpdatesAppLauncherWithDatabaseTests : XCTestCase

@property (nonatomic, strong) ABI46_0_0EXUpdatesDatabase *db;
@property (nonatomic, strong) NSURL *testDatabaseDir;

@end

@implementation ABI46_0_0EXUpdatesAppLauncherWithDatabaseTests

- (void)setUp
{
  NSURL *applicationSupportDir = [NSFileManager.defaultManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask].lastObject;
  _testDatabaseDir = [applicationSupportDir URLByAppendingPathComponent:@"ABI46_0_0EXUpdatesDatabaseTests"];
  if ([NSFileManager.defaultManager fileExistsAtPath:_testDatabaseDir.path]) {
    NSError *error;
    [NSFileManager.defaultManager removeItemAtPath:_testDatabaseDir.path error:&error];
    XCTAssertNil(error);
  }
  NSError *error;
  [NSFileManager.defaultManager createDirectoryAtPath:_testDatabaseDir.path withIntermediateDirectories:YES attributes:nil error:&error];
  XCTAssertNil(error);

  _db = [[ABI46_0_0EXUpdatesDatabase alloc] init];
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

- (void)testGetStoredUpdateIdsInEmptyDB
{
  NSArray<NSUUID *> * storedUpdateIds = [self _getStoredUpdatesInTestDB];

  XCTAssertNotNil(storedUpdateIds);
  XCTAssertEqual([storedUpdateIds count], 0);
}

- (void)testGetCorrectUpdateIdsInDB
{
  ABI46_0_0EXUpdatesUpdate *testUpdate = [ABI46_0_0EXUpdatesAppLauncherWithDatabaseMock testUpdate];
  NSDate *yesterday = [NSDate dateWithTimeIntervalSinceNow:24 * 60 * 60 * -1];
  testUpdate.lastAccessed = yesterday;
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error1;
    [_db addUpdate:testUpdate error:&error1];
    XCTAssertNil(error1);
  });

  NSArray<NSUUID *> * storedUpdateIds = [self _getStoredUpdatesInTestDB];

  XCTAssertNotNil(storedUpdateIds);
  XCTAssertEqual([storedUpdateIds count], 1);
  XCTAssertTrue([storedUpdateIds[0].UUIDString isEqualToString:testUpdate.updateId.UUIDString]);
}

- (void)testLaunchUpdate
{
  ABI46_0_0EXUpdatesUpdate *testUpdate = [ABI46_0_0EXUpdatesAppLauncherWithDatabaseMock testUpdate];
  NSDate *yesterday = [NSDate dateWithTimeIntervalSinceNow:24 * 60 * 60 * -1];
  testUpdate.lastAccessed = yesterday;
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error1;
    [_db addUpdate:testUpdate error:&error1];
    XCTAssertNil(error1);
  });

  ABI46_0_0EXUpdatesAsset *testAsset = [[ABI46_0_0EXUpdatesAsset alloc] initWithKey:@"bundle-1234" type:@"js"];
  testAsset.isLaunchAsset = YES;
  testAsset.downloadTime = [NSDate date];
  testAsset.contentHash = @"blah";
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error2;
    [_db addNewAssets:@[testAsset] toUpdateWithId:testUpdate.updateId error:&error2];
    XCTAssertNil(error2);
  });

  __block NSNumber *successValue;
  ABI46_0_0EXUpdatesAppLauncherWithDatabase *launcher = [[ABI46_0_0EXUpdatesAppLauncherWithDatabaseMock alloc] initWithConfig:[ABI46_0_0EXUpdatesConfig new] database:_db directory:_testDatabaseDir completionQueue:dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0)];
  [launcher launchUpdateWithSelectionPolicy:[ABI46_0_0EXUpdatesSelectionPolicy new] completion:^(NSError * _Nullable error, BOOL success) {
    successValue = @(success);
  }];

  while (!successValue) {
    sleep(0.1);
  }

  XCTAssertTrue(successValue.boolValue);

  dispatch_sync(_db.databaseQueue, ^{
    NSError *error3;
    ABI46_0_0EXUpdatesUpdate *sameUpdate = [_db updateWithId:testUpdate.updateId config:[ABI46_0_0EXUpdatesConfig new] error:&error3];
    XCTAssertNil(error3);
    XCTAssertNotEqualObjects(yesterday, sameUpdate.lastAccessed);
    XCTAssertTrue(fabs(sameUpdate.lastAccessed.timeIntervalSinceNow) < 1, @"new lastAccessed date should be within 1 second of now");
  });
}

- (NSArray<NSUUID *> *)_getStoredUpdatesInTestDB
{
  __block NSArray<NSUUID *> *storedUpdateIds = nil;
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  [ABI46_0_0EXUpdatesAppLauncherWithDatabase storedUpdateIdsInDatabase:_db completion:^(NSError * _Nullable error, NSArray<NSUUID *> * _Nonnull _storedUpdateIds) {
    storedUpdateIds = [NSArray arrayWithArray:_storedUpdateIds];
    dispatch_semaphore_signal(semaphore);
  }];
  dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_WALLTIME_NOW, 5000000000L)); // wait 5 seconds max
  return storedUpdateIds;
}

@end
