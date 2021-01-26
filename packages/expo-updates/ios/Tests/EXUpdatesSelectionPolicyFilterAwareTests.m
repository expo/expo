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
@property (nonatomic, strong) EXUpdatesUpdate *updateRollout1;
@property (nonatomic, strong) EXUpdatesUpdate *updateRollout2;
@property (nonatomic, strong) EXUpdatesUpdate *updateNested;
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

  _updateNested = [EXUpdatesNewUpdate updateWithNewManifest:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e72",
    @"createdAt": @"2021-01-11T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"updateMetadata": @{@"nested":@{@"object":@{@"key": @"value"}}}
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

- (void)testUpdatesToDelete_OlderMatching
{
  NSArray<EXUpdatesUpdate *> *actual = [_selectionPolicy updatesToDeleteWithLaunchedUpdate:_updateRollout2 updates:@[_updateDefault1, _updateRollout1, _updateDefault2, _updateRollout2] filters:_manifestFilters];
  XCTAssertEqual(2, actual.count, @"if there is an older update that matches the manifest filters, keep that one over any newer ones that don't match");
  XCTAssertTrue([actual containsObject:_updateDefault1]);
  XCTAssertTrue([actual containsObject:_updateDefault2]);
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

- (void)testShouldLoadNewUpdate_OlderExistsMatchingFilters
{
  XCTAssertFalse([_selectionPolicy shouldLoadNewUpdate:_updateDefault2 withLaunchedUpdate:_updateRollout1 filters:_manifestFilters], @"should not choose to load a new update that doesn't match the manifest filters if there is an existing older update that matches the filters");
}

- (void)testShouldLoadNewUpdate_NoneExistsMatchingCurrentFilters
{
  XCTAssertTrue([_selectionPolicy shouldLoadNewUpdate:_updateDefault2 withLaunchedUpdate:nil filters:_manifestFilters], @"should choose to load a new update that doesn't match the manifest filters if no existing updates match the manifest filters");
}

- (void)testShouldLoadNewUpdate_NoneExistsMatchingNewFilters
{
  XCTAssertTrue([_selectionPolicy shouldLoadNewUpdate:_updateDefault2 withLaunchedUpdate:_updateDefault1 filters:_manifestFilters], @"should choose to load a new update that doesn't match the manifest filters if no existing updates match the manifest filters");
}

- (void)testIsUpdateFiltered_Nested
{
  NSDictionary *nestedManifestFilters = @{@"nested.object.key": @"different-value"};

  // an update that has the matching key with a different value should be filtered out
  XCTAssertTrue([_selectionPolicy isUpdate:_updateNested filteredWithFilters:nestedManifestFilters]);

  // an update that doesn't have the key should not be filtered out
  XCTAssertFalse([_selectionPolicy isUpdate:_updateDefault1 filteredWithFilters:nestedManifestFilters]);
}

@end

