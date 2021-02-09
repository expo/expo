//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesSelectionPolicyFilterAware.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@interface EXUpdatesSelectionPolicyFilterAwareTests : XCTestCase

@property (nonatomic, strong) EXUpdatesUpdate *updateDefault1;
@property (nonatomic, strong) EXUpdatesUpdate *updateDefault2;
@property (nonatomic, strong) EXUpdatesUpdate *updateRollout0;
@property (nonatomic, strong) EXUpdatesUpdate *updateRollout1;
@property (nonatomic, strong) EXUpdatesUpdate *updateRollout2;
@property (nonatomic, strong) EXUpdatesUpdate *updateMultipleFilters;
@property (nonatomic, strong) EXUpdatesSelectionPolicyFilterAware *selectionPolicy;
@property (nonatomic, strong) NSDictionary *manifestFilters;

@end

@implementation EXUpdatesSelectionPolicyFilterAwareTests

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
  EXUpdatesConfig *config = [EXUpdatesConfig new];
  EXUpdatesDatabase *database = [EXUpdatesDatabase new];
  
  _updateRollout0 = [EXUpdatesNewUpdate updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e71",
    @"createdAt": @"2021-01-10T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"releaseName": @"rollout"}
  } config:config database:database];

  _updateDefault1 = [EXUpdatesNewUpdate updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e72",
    @"createdAt": @"2021-01-11T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"releaseName": @"default"}
  } config:config database:database];
  
  _updateRollout1 = [EXUpdatesNewUpdate updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e73",
    @"createdAt": @"2021-01-12T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"releaseName": @"rollout"}
  } config:config database:database];
  
  _updateDefault2 = [EXUpdatesNewUpdate updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e74",
    @"createdAt": @"2021-01-13T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"releaseName": @"default"}
  } config:config database:database];
  
  _updateRollout2 = [EXUpdatesNewUpdate updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e75",
    @"createdAt": @"2021-01-14T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"releaseName": @"rollout"}
  } config:config database:database];

  _updateMultipleFilters = [EXUpdatesNewUpdate updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e72",
    @"createdAt": @"2021-01-11T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"key1": @"value1", @"key2": @"value2"}
  } config:config database:database];

  _selectionPolicy = [[EXUpdatesSelectionPolicyFilterAware alloc] initWithRuntimeVersion:runtimeVersion];
  _manifestFilters = @{@"releaseName": @"rollout"};
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testLaunchableUpdateWithUpdates
{
  EXUpdatesUpdate *actual = [_selectionPolicy launchableUpdateWithUpdates:@[_updateDefault1, _updateRollout1, _updateDefault2] filters:_manifestFilters];
  XCTAssertEqual(_updateRollout1, actual, @"should pick the newest update that matches the manifest filters");
}

- (void)testUpdatesToDelete_SecondNewestMatching
{
  NSArray<EXUpdatesUpdate *> *actual = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_updateRollout2 updates:@[_updateRollout0, _updateDefault1, _updateRollout1, _updateDefault2, _updateRollout2] filters:_manifestFilters];
  XCTAssertEqual(3, actual.count, @"if there is an older update that matches the manifest filters, keep that one over any newer ones that don't match");
  XCTAssertTrue([actual containsObject:_updateDefault1]);
  XCTAssertTrue([actual containsObject:_updateDefault2]);
  XCTAssertTrue([actual containsObject:_updateRollout0]);
  XCTAssertFalse([actual containsObject:_updateRollout1]);
  XCTAssertFalse([actual containsObject:_updateRollout2]);
}

- (void)testUpdatesToDelete_NoneOlderMatching
{
  NSArray<EXUpdatesUpdate *> *actual = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_updateRollout2 updates:@[_updateDefault1, _updateDefault2, _updateRollout2] filters:_manifestFilters];
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
    @"key1": @"value1",
    @"key2": @"wrong-value"
  };
  XCTAssertFalse([_selectionPolicy doesUpdate:_updateMultipleFilters matchFilters:filtersBadMatch], @"should fail unless all filters pass");

  NSDictionary *filtersGoodMatch = @{
    @"key1": @"value1",
    @"key2": @"value2"
  };
  XCTAssertTrue([_selectionPolicy doesUpdate:_updateMultipleFilters matchFilters:filtersGoodMatch], @"should pass if all filters pass");
}

- (void)testDoesUpdateMatchFilters_EmptyMatchesAll
{
  XCTAssertTrue([_selectionPolicy doesUpdate:_updateDefault1 matchFilters:@{@"fieldThatUpdateDoesntHave": @"value"}], @"no field counts as a match");
}

@end

