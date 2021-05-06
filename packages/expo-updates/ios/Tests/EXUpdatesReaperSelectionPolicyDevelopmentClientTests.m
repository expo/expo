//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesReaperSelectionPolicyDevelopmentClient.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@interface EXUpdatesReaperSelectionPolicyDevelopmentClientTests : XCTestCase

@property (nonatomic, strong) EXUpdatesUpdate *update1;
@property (nonatomic, strong) EXUpdatesUpdate *update2;
@property (nonatomic, strong) EXUpdatesUpdate *update3;
@property (nonatomic, strong) EXUpdatesUpdate *update4;
@property (nonatomic, strong) EXUpdatesUpdate *update5;
@property (nonatomic, strong) id<EXUpdatesReaperSelectionPolicy> selectionPolicy;

@end

@implementation EXUpdatesReaperSelectionPolicyDevelopmentClientTests

- (void)setUp
{
  [super setUp];
  NSString *runtimeVersion = @"1.0";
  EXUpdatesConfig *config = [EXUpdatesConfig new];
  EXUpdatesDatabase *database = [EXUpdatesDatabase new];

  // test updates with different scopes to ensure this policy ignores scopes
  _update1 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:@"scope1" commitTime:[NSDate dateWithTimeIntervalSince1970:1608667851] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update2 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:@"scope2" commitTime:[NSDate dateWithTimeIntervalSince1970:1608667852] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update3 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:@"scope3" commitTime:[NSDate dateWithTimeIntervalSince1970:1608667853] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update4 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:@"scope4" commitTime:[NSDate dateWithTimeIntervalSince1970:1608667854] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];
  _update5 = [EXUpdatesUpdate updateWithId:NSUUID.UUID scopeKey:@"scope5" commitTime:[NSDate dateWithTimeIntervalSince1970:1608667855] runtimeVersion:runtimeVersion manifest:nil status:EXUpdatesUpdateStatusReady keep:YES config:config database:database];

  // for readability/writability, test with a policy that keeps only 3 updates;
  // the actual functionality is independent of the number
  _selectionPolicy = [[EXUpdatesReaperSelectionPolicyDevelopmentClient alloc] initWithMaxUpdatesToKeep:3];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testUpdatesToDelete_BasicCase
{
  _update1.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569811];
  _update2.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569812];
  _update3.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569813];
  _update4.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569814];
  _update5.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569815];

  // the order of the array shouldn't matter
  NSArray<EXUpdatesUpdate *> *updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update5 updates:@[_update2, _update5, _update4, _update1, _update3] filters:nil];

  XCTAssertEqual(2, updatesToDelete.count);
  XCTAssertTrue([updatesToDelete containsObject:_update1]);
  XCTAssertTrue([updatesToDelete containsObject:_update2]);
}

- (void)testUpdatesToDelete_SameLastAccessedDate
{
  // if multiple updates have the same lastAccessed date, should use commitTime to determine
  // which updates to delete
  _update1.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569810];
  _update2.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569810];
  _update3.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569810];
  _update4.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569810];

  NSArray<EXUpdatesUpdate *> *updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update4 updates:@[_update3, _update4, _update1, _update2] filters:nil];

  XCTAssertEqual(1, updatesToDelete.count);
  XCTAssertTrue([updatesToDelete containsObject:_update1]);
}

- (void)testUpdatesToDelete_LaunchedUpdateIsOldest
{
  // if the least recently accessed update happens to be launchedUpdate, delete instead the next
  // least recently accessed update
  _update1.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569811];
  _update2.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569812];
  _update3.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569813];
  _update4.lastAccessed = [NSDate dateWithTimeIntervalSince1970:1619569814];

  NSArray<EXUpdatesUpdate *> *updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update1 updates:@[_update1, _update2, _update3, _update4] filters:nil];

  XCTAssertEqual(1, updatesToDelete.count);
  XCTAssertTrue([updatesToDelete containsObject:_update2]);
}

- (void)testUpdatesToDelete_NoLaunchedUpdate
{
  // if launchedUpdate is null, something has gone wrong, so don't delete anything
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wnonnull"
  NSArray<EXUpdatesUpdate *> *updatesToDelete = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:nil updates:@[_update1, _update2, _update3, _update4] filters:nil];
#pragma clang diagnostic pop
  XCTAssertEqual(0, updatesToDelete.count);
}

- (void)testUpdatesToDelete_BelowMaxNumber
{
  // no need to delete any updates if we have <= the max number of updates
  NSArray<EXUpdatesUpdate *> *updatesToDeleteWith2Total = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update2 updates:@[_update1, _update2] filters:nil];
  NSArray<EXUpdatesUpdate *> *updatesToDeleteWith3Total = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_update3 updates:@[_update1, _update2, _update3] filters:nil];
  XCTAssertEqual(0, updatesToDeleteWith2Total.count);
  XCTAssertEqual(0, updatesToDeleteWith3Total.count);
}

@end
