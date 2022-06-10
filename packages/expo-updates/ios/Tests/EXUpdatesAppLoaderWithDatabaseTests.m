//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase+Tests.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>
#import <EXUpdates/EXUpdatesAppLoader.h>

static NSString * const updatesTestingDirectoryName = @"EXUpdatesTestingDirectory";

@interface EXUpdatesAppLoaderWithDatabaseTests : XCTestCase

@property(nonatomic) NSMutableArray<EXUpdatesUpdate *> *testUpdates;
@property(nonatomic) EXUpdatesDatabase *database;
@property(nonatomic) EXUpdatesAppLoader *underTest;

@end

@implementation EXUpdatesAppLoaderWithDatabaseTests

- (void)setUp {
  // Set up queues
  static dispatch_queue_t controllerQueue;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    controllerQueue = dispatch_queue_create("expo.EXUpdatesAppLoaderWithDatabaseTests.controllerQueue", DISPATCH_QUEUE_SERIAL);
  });

  // Set up directory
  [self createUpdatesTestingDirectory];
  // Create and open DB
  [self createDatabase];

  // Create array of test updates
  self.testUpdates = [NSMutableArray new];

  // Now set up the instance to be tested
  self.underTest = [[EXUpdatesAppLoader alloc] initWithConfig:[EXUpdatesConfig new] database:self.database directory:[self updatesTestingDirectory] launchedUpdate:nil completionQueue:controllerQueue];
}

- (void)tearDown {
  self.underTest = nil;
  self.testUpdates = nil;
  [self.database closeDatabase];
  [self removeUpdatesTestingDirectory];
}

- (void)testNoIdsForEmptyDb
{
  // Act
  NSArray<NSUUID *> * storedUpdateIds = [self.underTest storedUpdateIds:^(NSError * _Nonnull error) {
    XCTFail(@"Error in storedUpdateIds: %@", [error debugDescription]);
  }];
  // Assert
  XCTAssertNotNil(storedUpdateIds);
  XCTAssertEqual([storedUpdateIds count], 0);
}

- (void)testOneIdForOneStoredUpdate {
  // Arrange
  NSString *runtimeVersion = @"1.0";
  NSString *scopeKey = @"dummyScope";
  EXUpdatesUpdate *update = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667851] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:[EXUpdatesConfig new] database:self.database];

  [self.testUpdates addObject:update];
  [self addUpdateToDatabase:update];

  // Act
  NSArray<NSUUID *> * storedUpdateIds = [self.underTest storedUpdateIds:^(NSError * _Nonnull error) {
    XCTFail(@"Error in storedUpdateIds: %@", [error debugDescription]);
  }];

  // Assert
  XCTAssertNotNil(storedUpdateIds);
  XCTAssertEqual([storedUpdateIds count], 1);
  XCTAssertTrue([storedUpdateIds[0].UUIDString isEqualToString:self.testUpdates[0].updateId.UUIDString]);
}

#pragma mark - Private methods

- (NSURL *)updatesTestingDirectory {
  NSFileManager *fileManager = NSFileManager.defaultManager;
  NSURL *applicationDocumentsDirectory = [[fileManager URLsForDirectory:NSApplicationSupportDirectory
                                                              inDomains:NSUserDomainMask] lastObject];
  NSURL *updatesDirectory = [applicationDocumentsDirectory URLByAppendingPathComponent:updatesTestingDirectoryName];
  return updatesDirectory;
}

- (void)createUpdatesTestingDirectory
{
  NSURL *updatesDirectory = [self updatesTestingDirectory];
  NSFileManager *fileManager = NSFileManager.defaultManager;
  NSString *updatesDirectoryPath = [updatesDirectory path];
  BOOL exists = [fileManager fileExistsAtPath:updatesDirectoryPath];
  if (exists) {
    [fileManager removeItemAtPath:updatesDirectoryPath
                            error:nil];
  }
  [fileManager createDirectoryAtPath:updatesDirectoryPath
         withIntermediateDirectories:YES
                          attributes:nil
                               error:nil];
}

- (void)removeUpdatesTestingDirectory
{
  NSURL *updatesDirectory = [self updatesTestingDirectory];
  NSFileManager *fileManager = NSFileManager.defaultManager;
  NSString *updatesDirectoryPath = [updatesDirectory path];
  BOOL exists = [fileManager fileExistsAtPath:updatesDirectoryPath];
  if (exists) {
    [fileManager removeItemAtPath:updatesDirectoryPath
                            error:nil];
  }
}

- (void)createDatabase
{
  static dispatch_queue_t databaseQueue;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    databaseQueue = dispatch_queue_create("expo.EXUpdatesAppLoaderWithDatabaseTests.databaseQueue", DISPATCH_QUEUE_SERIAL);
  });
  self.database = [[EXUpdatesDatabase alloc] initWithDatabaseQueue:databaseQueue];
  EXUpdatesDatabase *_db = self.database;
  NSURL *_testDatabaseDir = [self updatesTestingDirectory];
  dispatch_sync(self.database.databaseQueue, ^{
    NSError *dbOpenError;
    [_db openDatabaseInDirectory:_testDatabaseDir withError:&dbOpenError];
    XCTAssertNil(dbOpenError);
  });
}

- (void)addUpdateToDatabase:(EXUpdatesUpdate *)update
{
  dispatch_sync(self.database.databaseQueue, ^{
      NSError *dbWriteError;
      [self.database addUpdate:update error:&dbWriteError];
      XCTAssertNil(dbWriteError);
    });
}

@end
