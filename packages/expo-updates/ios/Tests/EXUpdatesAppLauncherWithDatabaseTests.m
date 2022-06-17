//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesAppLauncherWithDatabase+Tests.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>

@interface EXUpdatesAppLauncherWithDatabaseMock : EXUpdatesAppLauncherWithDatabase

+ (EXUpdatesUpdate *)testUpdate;

@end

@implementation EXUpdatesAppLauncherWithDatabaseMock

+ (EXUpdatesUpdate *)testUpdate
{
  static EXUpdatesUpdate *theUpdate;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theUpdate) {
      NSString *runtimeVersion = @"1.0";
      NSString *scopeKey = @"dummyScope";
      EXUpdatesConfig *config = [EXUpdatesConfig new];
      EXUpdatesDatabase *database = [EXUpdatesDatabase new];
      theUpdate = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667851] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];
    }
  });
  return theUpdate;
}

+ (void)launchableUpdateWithConfig:(EXUpdatesConfig *)config
                          database:(EXUpdatesDatabase *)database
                   selectionPolicy:(EXUpdatesSelectionPolicy *)selectionPolicy
                        completion:(EXUpdatesAppLauncherUpdateCompletionBlock)completion
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

@interface EXUpdatesAppLauncherWithDatabaseTests : XCTestCase

@property (nonatomic, strong) EXUpdatesDatabase *db;
@property (nonatomic, strong) NSURL *testDatabaseDir;

@end

@implementation EXUpdatesAppLauncherWithDatabaseTests

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

- (void)testGetStoredUpdateIdsInEmptyDB
{
  NSArray<NSUUID *> * storedUpdateIds = [self _getStoredUpdatesInTestDB];

  XCTAssertNotNil(storedUpdateIds);
  XCTAssertEqual([storedUpdateIds count], 0);
}

- (void)testGetCorrectUpdateIdsInDB
{
  EXUpdatesUpdate *testUpdate = [EXUpdatesAppLauncherWithDatabaseMock testUpdate];
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
  EXUpdatesUpdate *testUpdate = [EXUpdatesAppLauncherWithDatabaseMock testUpdate];
  NSDate *yesterday = [NSDate dateWithTimeIntervalSinceNow:24 * 60 * 60 * -1];
  testUpdate.lastAccessed = yesterday;
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error1;
    [_db addUpdate:testUpdate error:&error1];
    XCTAssertNil(error1);
  });

  EXUpdatesAsset *testAsset = [[EXUpdatesAsset alloc] initWithKey:@"bundle-1234" type:@"js"];
  testAsset.isLaunchAsset = YES;
  testAsset.downloadTime = [NSDate date];
  testAsset.contentHash = @"blah";
  dispatch_sync(_db.databaseQueue, ^{
    NSError *error2;
    [_db addNewAssets:@[testAsset] toUpdateWithId:testUpdate.updateId error:&error2];
    XCTAssertNil(error2);
  });

  __block NSNumber *successValue;
  EXUpdatesAppLauncherWithDatabase *launcher = [[EXUpdatesAppLauncherWithDatabaseMock alloc] initWithConfig:[EXUpdatesConfig new] database:_db directory:_testDatabaseDir completionQueue:dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0)];
  [launcher launchUpdateWithSelectionPolicy:[EXUpdatesSelectionPolicy new] completion:^(NSError * _Nullable error, BOOL success) {
    successValue = @(success);
  }];

  while (!successValue) {
    sleep(0.1);
  }

  XCTAssertTrue(successValue.boolValue);

  dispatch_sync(_db.databaseQueue, ^{
    NSError *error3;
    EXUpdatesUpdate *sameUpdate = [_db updateWithId:testUpdate.updateId config:[EXUpdatesConfig new] error:&error3];
    XCTAssertNil(error3);
    XCTAssertNotEqualObjects(yesterday, sameUpdate.lastAccessed);
    XCTAssertTrue(fabs(sameUpdate.lastAccessed.timeIntervalSinceNow) < 1, @"new lastAccessed date should be within 1 second of now");
  });
}

- (NSArray<NSUUID *> *)_getStoredUpdatesInTestDB
{
  __block NSArray<NSUUID *> *storedUpdateIds = nil;
  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  [EXUpdatesAppLauncherWithDatabase storedUpdateIdsInDatabase:_db completion:^(NSError * _Nullable error, NSArray<NSUUID *> * _Nonnull _storedUpdateIds) {
    storedUpdateIds = [NSArray arrayWithArray:_storedUpdateIds];
    dispatch_semaphore_signal(semaphore);
  }];
  dispatch_semaphore_wait(semaphore, dispatch_time(DISPATCH_WALLTIME_NOW, 5000000000L)); // wait 5 seconds max
  return storedUpdateIds;
}

@end
