//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesReaperSelectionPolicyFilterAware.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@interface EXUpdatesReaperSelectionPolicyFilterAwareTests : XCTestCase

@property (nonatomic, strong) EXUpdatesConfig *config;
@property (nonatomic, strong) EXUpdatesDatabase *database;
@property (nonatomic, strong) EXUpdatesUpdate *update1;
@property (nonatomic, strong) EXUpdatesUpdate *update2;
@property (nonatomic, strong) EXUpdatesUpdate *update3;
@property (nonatomic, strong) EXUpdatesUpdate *update4;
@property (nonatomic, strong) EXUpdatesUpdate *update5;
@property (nonatomic, strong) id<EXUpdatesReaperSelectionPolicy> selectionPolicy;

@end

@implementation EXUpdatesReaperSelectionPolicyFilterAwareTests

- (void)setUp
{
  [super setUp];
  NSString *runtimeVersion = @"1.0";
  NSString *scopeKey = @"dummyScope";
  _config = [EXUpdatesConfig new];
  _database = [EXUpdatesDatabase new];
  _update1 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667851] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:_config database:_database];
  _update2 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667852] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:_config database:_database];
  _update3 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667853] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:_config database:_database];
  _update4 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667854] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:_config database:_database];
  _update5 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667855] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:_config database:_database];
  _selectionPolicy = [[EXUpdatesReaperSelectionPolicyFilterAware alloc] init];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testUpdatesToDelete_onlyOneUpdate
{
  NSArray<EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update1 updates:@[_update1] filters:nil];
  XCTAssert(0 == updatesToDelete.count);
}

- (void)testUpdatesToDelete_olderUpdates
{
  NSArray<EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update3 updates:@[_update1, _update2, _update3] filters:nil];
  XCTAssert(1 == updatesToDelete.count);
  XCTAssert([updatesToDelete containsObject:_update1]);
  XCTAssert(![updatesToDelete containsObject:_update2]);
  XCTAssert(![updatesToDelete containsObject:_update3]);
}

- (void)testUpdatesToDelete_newerUpdates
{
  NSArray<EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update1 updates:@[_update1, _update2] filters:nil];
  XCTAssert(0 == updatesToDelete.count);
}

- (void)testUpdatesToDelete_olderAndNewerUpdates
{
  NSArray<EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update4 updates:@[_update1, _update2, _update3, _update4, _update5] filters:nil];
  XCTAssert(2 == updatesToDelete.count);
  XCTAssert([updatesToDelete containsObject:_update1]);
  XCTAssert([updatesToDelete containsObject:_update2]);
  XCTAssert(![updatesToDelete containsObject:_update3]);
  XCTAssert(![updatesToDelete containsObject:_update4]);
  XCTAssert(![updatesToDelete containsObject:_update5]);
}

- (void)testUpdatesToDelete_differentScopeKey
{
  EXUpdatesUpdate *update4DifferentScope = [EXUpdatesUpdate updateWithId:_update4.updateId scopeKey:@"differentScopeKey" commitTime:_update4.commitTime runtimeVersion:_update4.runtimeVersion manifest:nil status:_update4.status keep:YES config:_config database:_database];

  NSArray<EXUpdatesUpdate *> *updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:update4DifferentScope updates:@[_update1, _update2, _update3, update4DifferentScope] filters:nil];

  XCTAssertEqual(0, updatesToDelete.count);
}

@end
