//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesSelectionPolicyNewest.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate.h>

@interface ABI41_0_0EXUpdatesSelectionPolicyNewestTests : XCTestCase

@property (nonatomic, strong) ABI41_0_0EXUpdatesUpdate *update1;
@property (nonatomic, strong) ABI41_0_0EXUpdatesUpdate *update2;
@property (nonatomic, strong) ABI41_0_0EXUpdatesUpdate *update3;
@property (nonatomic, strong) ABI41_0_0EXUpdatesUpdate *update4;
@property (nonatomic, strong) ABI41_0_0EXUpdatesUpdate *update5;
@property (nonatomic, strong) id<ABI41_0_0EXUpdatesSelectionPolicy> selectionPolicy;

@end

@implementation ABI41_0_0EXUpdatesSelectionPolicyNewestTests

- (void)setUp
{
  [super setUp];
  NSString *runtimeVersion = @"1.0";
  NSString *scopeKey = @"dummyScope";
  ABI41_0_0EXUpdatesConfig *config = [ABI41_0_0EXUpdatesConfig new];
  ABI41_0_0EXUpdatesDatabase *database = [ABI41_0_0EXUpdatesDatabase new];
  _update1 = [ABI41_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667851] runtimeVersion:runtimeVersion metadata:nil status:ABI41_0_0EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update2 = [ABI41_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667852] runtimeVersion:runtimeVersion metadata:nil status:ABI41_0_0EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update3 = [ABI41_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667853] runtimeVersion:runtimeVersion metadata:nil status:ABI41_0_0EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update4 = [ABI41_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667854] runtimeVersion:runtimeVersion metadata:nil status:ABI41_0_0EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update5 = [ABI41_0_0EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667855] runtimeVersion:runtimeVersion metadata:nil status:ABI41_0_0EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _selectionPolicy = [[ABI41_0_0EXUpdatesSelectionPolicyNewest alloc] initWithRuntimeVersion:runtimeVersion];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testUpdatesToDelete_onlyOneUpdate
{
  NSArray<ABI41_0_0EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update1 updates:@[_update1] filters:nil];
  XCTAssert(0 == updatesToDelete.count);
}

- (void)testUpdatesToDelete_olderUpdates
{
  NSArray<ABI41_0_0EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update3 updates:@[_update1, _update2, _update3] filters:nil];
  XCTAssert(1 == updatesToDelete.count);
  XCTAssert([updatesToDelete containsObject:_update1]);
  XCTAssert(![updatesToDelete containsObject:_update2]);
  XCTAssert(![updatesToDelete containsObject:_update3]);
}

- (void)testUpdatesToDelete_newerUpdates
{
  NSArray<ABI41_0_0EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update1 updates:@[_update1, _update2] filters:nil];
  XCTAssert(0 == updatesToDelete.count);
}

- (void)testUpdatesToDelete_olderAndNewerUpdates
{
  NSArray<ABI41_0_0EXUpdatesUpdate *>* updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update4 updates:@[_update1, _update2, _update3, _update4, _update5] filters:nil];
  XCTAssert(2 == updatesToDelete.count);
  XCTAssert([updatesToDelete containsObject:_update1]);
  XCTAssert([updatesToDelete containsObject:_update2]);
  XCTAssert(![updatesToDelete containsObject:_update3]);
  XCTAssert(![updatesToDelete containsObject:_update4]);
  XCTAssert(![updatesToDelete containsObject:_update5]);
}

@end
