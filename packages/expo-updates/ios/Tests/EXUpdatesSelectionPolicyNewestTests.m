//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesSelectionPolicyNewest.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@interface EXUpdatesSelectionPolicyNewestTests : XCTestCase

@property (nonatomic, strong) EXUpdatesUpdate *update1;
@property (nonatomic, strong) EXUpdatesUpdate *update2;
@property (nonatomic, strong) EXUpdatesUpdate *update3;
@property (nonatomic, strong) EXUpdatesUpdate *update4;
@property (nonatomic, strong) EXUpdatesUpdate *update5;
@property (nonatomic, strong) id<EXUpdatesSelectionPolicy> selectionPolicy;

@end

@implementation EXUpdatesSelectionPolicyNewestTests

- (void)setUp
{
  [super setUp];
  NSString *runtimeVersion = @"1.0";
  NSString *scopeKey = @"dummyScope";
  EXUpdatesConfig *config = [EXUpdatesConfig new];
  EXUpdatesDatabase *database = [EXUpdatesDatabase new];
  _update1 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667851] runtimeVersion:runtimeVersion metadata:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update2 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667852] runtimeVersion:runtimeVersion metadata:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update3 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667853] runtimeVersion:runtimeVersion metadata:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update4 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667854] runtimeVersion:runtimeVersion metadata:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update5 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:scopeKey commitTime:[NSDate dateWithTimeIntervalSince1970:1608667855] runtimeVersion:runtimeVersion metadata:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _selectionPolicy = [[EXUpdatesSelectionPolicyNewest alloc] initWithRuntimeVersion:runtimeVersion];
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

@end
