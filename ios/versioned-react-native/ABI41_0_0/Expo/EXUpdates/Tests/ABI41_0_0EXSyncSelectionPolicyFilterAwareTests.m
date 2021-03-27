//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncNewManifest.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncSelectionPolicyFilterAware.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncManifest.h>

@interface ABI41_0_0EXSyncSelectionPolicyFilterAwareTests : XCTestCase

@property (nonatomic, strong) ABI41_0_0EXSyncManifest *updateDefault1;
@property (nonatomic, strong) ABI41_0_0EXSyncManifest *updateDefault2;
@property (nonatomic, strong) ABI41_0_0EXSyncManifest *updateRollout0;
@property (nonatomic, strong) ABI41_0_0EXSyncManifest *updateRollout1;
@property (nonatomic, strong) ABI41_0_0EXSyncManifest *updateRollout2;
@property (nonatomic, strong) ABI41_0_0EXSyncManifest *updateMultipleFilters;
@property (nonatomic, strong) ABI41_0_0EXSyncManifest *updateNoMetadata;
@property (nonatomic, strong) ABI41_0_0EXSyncSelectionPolicyFilterAware *selectionPolicy;
@property (nonatomic, strong) NSDictionary *manifestFilters;

@end

@implementation ABI41_0_0EXSyncSelectionPolicyFilterAwareTests

- (void)setUp
{
  [super setUp];
  NSDictionary *launchAsset = @{
    @"hash": @"DW5MBgKq155wnX8rCP1lnsW6BsTbfKLXxGXRQx1RcOA",
    @"key": @"0436e5821bff7b95a84c21f22a43cb96.bundle",
    @"contentType": @"application/javascript",
    @"url": @"https://url.to/bundle"
  };
  NSDictionary *imageAsset = @{
    @"hash": @"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo",
    @"key": @"3261e570d51777be1e99116562280926.png",
    @"contentType": @"image/png",
    @"url": @"https://url.to/asset"
  };

  NSString *runtimeVersion = @"1.0";
  NSString *scopeKey = @"dummyScope";
  ABI41_0_0EXSyncConfig *config = [ABI41_0_0EXSyncConfig new];
  ABI41_0_0EXSyncDatabase *database = [ABI41_0_0EXSyncDatabase new];
  
  _updateRollout0 = [ABI41_0_0EXSyncNewManifest updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e71",
    @"createdAt": @"2021-01-10T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"branchName": @"rollout"}
  } response:nil config:config database:database];

  _updateDefault1 = [ABI41_0_0EXSyncNewManifest updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e72",
    @"createdAt": @"2021-01-11T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"branchName": @"default"}
  } response:nil config:config database:database];
  
  _updateRollout1 = [ABI41_0_0EXSyncNewManifest updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e73",
    @"createdAt": @"2021-01-12T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"branchName": @"rollout"}
  } response:nil config:config database:database];
  
  _updateDefault2 = [ABI41_0_0EXSyncNewManifest updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e74",
    @"createdAt": @"2021-01-13T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"branchName": @"default"}
  } response:nil config:config database:database];
  
  _updateRollout2 = [ABI41_0_0EXSyncNewManifest updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e75",
    @"createdAt": @"2021-01-14T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"branchName": @"rollout"}
  } response:nil config:config database:database];

  _updateMultipleFilters = [ABI41_0_0EXSyncNewManifest updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e72",
    @"createdAt": @"2021-01-11T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"firstKey": @"value1", @"secondKey": @"value2"}
  } response:nil config:config database:database];

  _updateNoMetadata = [ABI41_0_0EXSyncNewManifest updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e72",
    @"createdAt": @"2021-01-11T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset]
  } response:nil config:config database:database];

  _selectionPolicy = [[ABI41_0_0EXSyncSelectionPolicyFilterAware alloc] initWithRuntimeVersion:runtimeVersion];
  _manifestFilters = @{@"branchname": @"rollout"};
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testLaunchableUpdateWithUpdates
{
  ABI41_0_0EXSyncManifest *actual = [_selectionPolicy launchableUpdateWithUpdates:@[_updateDefault1, _updateRollout1, _updateDefault2] filters:_manifestFilters];
  XCTAssertEqual(_updateRollout1, actual, @"should pick the newest update that matches the manifest filters");
}

- (void)testUpdatesToDelete_SecondNewestMatching
{
  NSArray<ABI41_0_0EXSyncManifest *> *actual = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_updateRollout2 updates:@[_updateRollout0, _updateDefault1, _updateRollout1, _updateDefault2, _updateRollout2] filters:_manifestFilters];
  XCTAssertEqual(3, actual.count, @"if there is an older update that matches the manifest filters, keep that one over any newer ones that don't match");
  XCTAssertTrue([actual containsObject:_updateDefault1]);
  XCTAssertTrue([actual containsObject:_updateDefault2]);
  XCTAssertTrue([actual containsObject:_updateRollout0]);
  XCTAssertFalse([actual containsObject:_updateRollout1]);
  XCTAssertFalse([actual containsObject:_updateRollout2]);
}

- (void)testUpdatesToDelete_NoneOlderMatching
{
  NSArray<ABI41_0_0EXSyncManifest *> *actual = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_updateRollout2 updates:@[_updateDefault1, _updateDefault2, _updateRollout2] filters:_manifestFilters];
  XCTAssertEqual(1, actual.count, @"if there is no older update that matches the manifest filters, just keep the next newest one");
  XCTAssertTrue([actual containsObject:_updateDefault1]);
  XCTAssertFalse([actual containsObject:_updateDefault2]);
  XCTAssertFalse([actual containsObject:_updateRollout2]);
}

- (void)testShouldLoadNewUpdate_NormalCase_NewUpdate
{
  XCTAssertTrue([_selectionPolicy shouldLoadNewUpdate:_updateRollout2 withLaunchedUpdate:_updateRollout1 filters:_manifestFilters]);
}

- (void)testShouldLoadNewUpdate_NormalCase_NoUpdate
{
  XCTAssertFalse([_selectionPolicy shouldLoadNewUpdate:_updateRollout1 withLaunchedUpdate:_updateRollout1 filters:_manifestFilters]);
}

- (void)testShouldLoadNewUpdate_NoneMatchingFilters
{
  XCTAssertTrue([_selectionPolicy shouldLoadNewUpdate:_updateRollout1 withLaunchedUpdate:_updateDefault2 filters:_manifestFilters], @"should choose to load an older update if the current update doesn't match the manifest filters");
}

- (void)testShouldLoadNewUpdate_NewerExists
{
  XCTAssertFalse([_selectionPolicy shouldLoadNewUpdate:_updateRollout1 withLaunchedUpdate:_updateRollout2 filters:_manifestFilters]);
}

- (void)testShouldLoadNewUpdate_DoesntMatch
{
  XCTAssertFalse([_selectionPolicy shouldLoadNewUpdate:_updateDefault2 withLaunchedUpdate:nil filters:_manifestFilters], @"should never load an update that doesn't match its own filters");
}

- (void)testDoesUpdateMatchFilters_MultipleFilters
{
  NSDictionary *filtersBadMatch = @{
    @"firstkey": @"value1",
    @"secondkey": @"wrong-value"
  };
  XCTAssertFalse([ABI41_0_0EXSyncSelectionPolicyFilterAware doesUpdate:_updateMultipleFilters matchFilters:filtersBadMatch], @"should fail unless all filters pass");

  NSDictionary *filtersGoodMatch = @{
    @"firstkey": @"value1",
    @"secondkey": @"value2"
  };
  XCTAssertTrue([ABI41_0_0EXSyncSelectionPolicyFilterAware doesUpdate:_updateMultipleFilters matchFilters:filtersGoodMatch], @"should pass if all filters pass");
}

- (void)testDoesUpdateMatchFilters_EmptyMatchesAll
{
  XCTAssertTrue([ABI41_0_0EXSyncSelectionPolicyFilterAware doesUpdate:_updateDefault1 matchFilters:@{@"field-that-update-doesnt-have": @"value"}], @"no field counts as a match");
}

- (void)testDoesUpdateMatchFilters_Null
{
  // null filters or null updateMetadata (i.e. bare or legacy manifests) is counted as a match
  XCTAssertTrue([ABI41_0_0EXSyncSelectionPolicyFilterAware doesUpdate:_updateDefault1 matchFilters:nil]);
  XCTAssertTrue([ABI41_0_0EXSyncSelectionPolicyFilterAware doesUpdate:_updateNoMetadata matchFilters:_manifestFilters]);
}

@end

