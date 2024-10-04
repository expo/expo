//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesSelectionPolicyFactory.h>
#import <EXUpdates/EXUpdatesSelectionPolicies.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@interface EXUpdatesSelectionPolicyFilterAwareTests : XCTestCase

@property (nonatomic, strong) EXUpdatesUpdate *updateDefault1;
@property (nonatomic, strong) EXUpdatesUpdate *updateDefault2;
@property (nonatomic, strong) EXUpdatesUpdate *updateRollout0;
@property (nonatomic, strong) EXUpdatesUpdate *updateRollout1;
@property (nonatomic, strong) EXUpdatesUpdate *updateRollout2;
@property (nonatomic, strong) EXUpdatesUpdate *updateMultipleFilters;
@property (nonatomic, strong) EXUpdatesUpdate *updateNoMetadata;
@property (nonatomic, strong) EXUpdatesSelectionPolicy *selectionPolicy;
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
    @"fileExtension": @".js",
    @"url": @"https://url.to/bundle"
  };
  NSDictionary *imageAsset = @{
    @"hash": @"JSeRsPNKzhVdHP1OEsDVsLH500Zfe4j1O7xWfa14oBo",
    @"key": @"3261e570d51777be1e99116562280926.png",
    @"contentType": @"image/png",
    @"fileExtension": @".png",
    @"url": @"https://url.to/asset"
  };

  NSString *runtimeVersion = @"1.0";
  NSString *scopeKey = @"dummyScope";
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    EXUpdatesConfigRuntimeVersionKey: runtimeVersion,
    EXUpdatesConfigScopeKeyKey: scopeKey
  }];
  EXUpdatesDatabase *database = [EXUpdatesDatabase new];
  EXUpdatesManifestHeaders *manifestHeaders = [[EXUpdatesManifestHeaders alloc] initWithProtocolVersion:nil
                                                                                   serverDefinedHeaders:nil
                                                                                        manifestFilters:nil
                                                                                      manifestSignature:nil
                                                                                              signature:nil];

  _updateRollout0 = [EXUpdatesNewUpdate updateWithNewManifest:[[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e71",
    @"createdAt": @"2021-01-10T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"metadata": @{@"branchName": @"rollout"}
  }] manifestHeaders:manifestHeaders extensions:@{} config:config database:database];

  _updateDefault1 = [EXUpdatesNewUpdate updateWithNewManifest:[[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e72",
    @"createdAt": @"2021-01-11T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"metadata": @{@"branchName": @"default"}
  }] manifestHeaders:manifestHeaders extensions:@{} config:config database:database];

  _updateRollout1 = [EXUpdatesNewUpdate updateWithNewManifest:[[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e73",
    @"createdAt": @"2021-01-12T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"metadata": @{@"branchName": @"rollout"}
  }] manifestHeaders:manifestHeaders extensions:@{} config:config database:database];

  _updateDefault2 = [EXUpdatesNewUpdate updateWithNewManifest:[[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e74",
    @"createdAt": @"2021-01-13T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"metadata": @{@"branchName": @"default"}
  }] manifestHeaders:manifestHeaders extensions:@{} config:config database:database];

  _updateRollout2 = [EXUpdatesNewUpdate updateWithNewManifest:[[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e75",
    @"createdAt": @"2021-01-14T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"metadata": @{@"branchName": @"rollout"}
  }] manifestHeaders:manifestHeaders extensions:@{} config:config database:database];

  _updateMultipleFilters = [EXUpdatesNewUpdate updateWithNewManifest:[[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e72",
    @"createdAt": @"2021-01-11T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset],
    @"metadata": @{@"firstKey": @"value1", @"secondKey": @"value2"}
  }] manifestHeaders:manifestHeaders extensions:@{} config:config database:database];

  _updateNoMetadata = [EXUpdatesNewUpdate updateWithNewManifest:[[EXManifestsNewManifest alloc] initWithRawManifestJSON:@{
    @"id": @"079cde35-8433-4c17-81c8-7117c1513e72",
    @"createdAt": @"2021-01-11T19:39:22.480Z",
    @"runtimeVersion": @"1.0",
    @"launchAsset": launchAsset,
    @"assets": @[imageAsset]
  }] manifestHeaders:manifestHeaders extensions:@{} config:config database:database];

  _selectionPolicy = [EXUpdatesSelectionPolicyFactory filterAwarePolicyWithRuntimeVersion:runtimeVersion];
  _manifestFilters = @{@"branchname": @"rollout"};
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testLaunchableUpdateFromUpdates
{
  EXUpdatesUpdate *actual = [_selectionPolicy launchableUpdateFromUpdates:@[_updateDefault1, _updateRollout1, _updateDefault2] filters:_manifestFilters];
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

- (void)testShouldLoadNewUpdate_NormalCase_OlderUpdate
{
  // this could happen if the embedded update is newer than the most recently published update
  XCTAssertFalse([_selectionPolicy shouldLoadNewUpdate:_updateRollout1 withLaunchedUpdate:_updateRollout2 filters:_manifestFilters]);
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
  XCTAssertFalse([EXUpdatesSelectionPolicies doesUpdate:_updateMultipleFilters matchFilters:filtersBadMatch], @"should fail unless all filters pass");

  NSDictionary *filtersGoodMatch = @{
    @"firstkey": @"value1",
    @"secondkey": @"value2"
  };
  XCTAssertTrue([EXUpdatesSelectionPolicies doesUpdate:_updateMultipleFilters matchFilters:filtersGoodMatch], @"should pass if all filters pass");
}

- (void)testDoesUpdateMatchFilters_EmptyMatchesAll
{
  XCTAssertTrue([EXUpdatesSelectionPolicies doesUpdate:_updateDefault1 matchFilters:@{@"field-that-update-doesnt-have": @"value"}], @"no field counts as a match");
}

- (void)testDoesUpdateMatchFilters_Null
{
  // null filters or null metadata (i.e. bare or legacy manifests) is counted as a match
  XCTAssertTrue([EXUpdatesSelectionPolicies doesUpdate:_updateDefault1 matchFilters:nil]);
  XCTAssertTrue([EXUpdatesSelectionPolicies doesUpdate:_updateNoMetadata matchFilters:_manifestFilters]);
}

@end

