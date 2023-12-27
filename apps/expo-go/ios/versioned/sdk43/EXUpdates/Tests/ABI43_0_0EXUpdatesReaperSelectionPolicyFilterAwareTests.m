//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesConfig.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesDatabase.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesReaperSelectionPolicyFilterAware.h>
#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesUpdate.h>

@interface ABI43_0_0EXUpdatesReaperSelectionPolicyFilterAwareTests : XCTestCase

@property (nonatomic, strong) ABI43_0_0EXUpdatesConfig *config;
@property (nonatomic, strong) ABI43_0_0EXUpdatesDatabase *database;
@property (nonatomic, strong) ABI43_0_0EXUpdatesUpdate *update1;
@property (nonatomic, strong) ABI43_0_0EXUpdatesUpdate *update2;
@property (nonatomic, strong) ABI43_0_0EXUpdatesUpdate *update3;
@property (nonatomic, strong) ABI43_0_0EXUpdatesUpdate *update4;
@property (nonatomic, strong) ABI43_0_0EXUpdatesUpdate *update5;
@property (nonatomic, strong) id<ABI43_0_0EXUpdatesReaperSelectionPolicy> selectionPolicy;

@end

@implementation ABI43_0_0EXUpdatesReaperSelectionPolicyFilterAwareTests

- (void)setUp
{
  [super setUp];
  NSString *runtimeVersion = @"1.0";
  NSString *scopeKey = @"dummyScope";
  _config = [ABI43_0_0EXUpdatesConfig new];
  _database = [ABI43_0_0EXUpdatesDatabase new];
  _update1 = [ABI43_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667851] runtimeVersion:runtimeVersion manifest:nil status:ABI43_0_0EXUpdatesUpdateStatusReady keep:YES config:_config database:_database];
  _update2 = [ABI43_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667852] runtimeVersion:runtimeVersion manifest:nil status:ABI43_0_0EXUpdatesUpdateStatusReady keep:YES config:_config database:_database];
  _update3 = [ABI43_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667853] runtimeVersion:runtimeVersion manifest:nil status:ABI43_0_0EXUpdatesUpdateStatusReady keep:YES config:_config database:_database];
  _update4 = [ABI43_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667854] runtimeVersion:runtimeVersion manifest:nil status:ABI43_0_0EXUpdatesUpdateStatusReady keep:YES config:_config database:_database];
  _update5 = [ABI43_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667855] runtimeVersion:runtimeVersion manifest:nil status:ABI43_0_0EXUpdatesUpdateStatusReady keep:YES config:_config database:_database];
  _selectionPolicy = [[ABI43_0_0EXUpdatesReaperSelectionPolicyFilterAware alloc] init];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testUpdatesToDelete_onlyOneUpdate
{
  NSArray<ABI43_0_0EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update1 updates:@[_update1] filters:nil];
  XCTAssert(0 == updatesToDelete.count);
}

- (void)testUpdatesToDelete_olderUpdates
{
  NSArray<ABI43_0_0EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update3 updates:@[_update1, _update2, _update3] filters:nil];
  XCTAssert(1 == updatesToDelete.count);
  XCTAssert([updatesToDelete containsObject:_update1]);
  XCTAssert(![updatesToDelete containsObject:_update2]);
  XCTAssert(![updatesToDelete containsObject:_update3]);
}

- (void)testUpdatesToDelete_newerUpdates
{
  NSArray<ABI43_0_0EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update1 updates:@[_update1, _update2] filters:nil];
  XCTAssert(0 == updatesToDelete.count);
}

- (void)testUpdatesToDelete_olderAndNewerUpdates
{
  NSArray<ABI43_0_0EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update4 updates:@[_update1, _update2, _update3, _update4, _update5] filters:nil];
  XCTAssert(2 == updatesToDelete.count);
  XCTAssert([updatesToDelete containsObject:_update1]);
  XCTAssert([updatesToDelete containsObject:_update2]);
  XCTAssert(![updatesToDelete containsObject:_update3]);
  XCTAssert(![updatesToDelete containsObject:_update4]);
  XCTAssert(![updatesToDelete containsObject:_update5]);
}

- (void)testUpdatesToDelete_differentScopeKey
{
  ABI43_0_0EXUpdatesUpdate *update4DifferentScope = [ABI43_0_0EXUpdatesUpdate updateWithId:_update4.updateId scopeKey:@"differentScopeKey" commitTime:_update4.commitTime runtimeVersion:_update4.runtimeVersion manifest:nil status:_update4.status keep:YES config:_config database:_database];

  NSArray<ABI43_0_0EXUpdatesUpdate *> *updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:update4DifferentScope updates:@[_update1, _update2, _update3, update4DifferentScope] filters:nil];

  XCTAssertEqual(0, updatesToDelete.count);
}

@end
