//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesBareUpdate.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesLegacyUpdate.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesNewUpdate.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate.h>

@interface ABI41_0_0EXUpdatesUpdateTests : XCTestCase

@property (nonatomic, strong) NSDictionary *legacyManifest;
@property (nonatomic, strong) NSDictionary *easNewManifest;
@property (nonatomic, strong) NSDictionary *bareManifest;

@property (nonatomic, strong) ABI41_0_0EXUpdatesConfig *configUsesLegacyManifestTrue;
@property (nonatomic, strong) ABI41_0_0EXUpdatesConfig *configUsesLegacyManifestFalse;
@property (nonatomic, strong) ABI41_0_0EXUpdatesDatabase *database;

@end

@implementation ABI41_0_0EXUpdatesUpdateTests

- (void)setUp
{
  _legacyManifest = @{
    @"sdkVersion": @"39.0.0",
    @"releaseId": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @"2020-11-11T00:17:54.797Z",
    @"bundleUrl": @"https://url.to/bundle.js"
  };

  _easNewManifest = @{
    @"manifest": @{
      @"runtimeVersion": @"1",
      @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
      @"createdAt": @"2020-11-11T00:17:54.797Z",
      @"launchAsset": @{@"url": @"https://url.to/bundle.js", @"contentType": @"application/javascript"}
    }
  };

  _bareManifest = @{
    @"id": @"0eef8214-4833-4089-9dff-b4138a14f196",
    @"commitTime": @(1609975977832)
  };

  _configUsesLegacyManifestTrue = [ABI41_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI41_0_0EXUpdatesURL": @"https://exp.host/@test/test",
    @"ABI41_0_0EXUpdatesUsesLegacyManifest": @(YES)
  }];

  _configUsesLegacyManifestFalse = [ABI41_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI41_0_0EXUpdatesURL": @"https://exp.host/@test/test",
    @"ABI41_0_0EXUpdatesUsesLegacyManifest": @(NO)
  }];

  _database = [ABI41_0_0EXUpdatesDatabase new];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testUpdateWithManifest_Legacy
{
  ABI41_0_0EXUpdatesUpdate *update = [ABI41_0_0EXUpdatesUpdate updateWithManifest:_legacyManifest response:nil config:_configUsesLegacyManifestTrue database:_database];
  XCTAssert(update != nil);
}

- (void)testUpdateWithManifest_New
{
  ABI41_0_0EXUpdatesUpdate *update = [ABI41_0_0EXUpdatesUpdate updateWithManifest:_easNewManifest response:nil config:_configUsesLegacyManifestFalse database:_database];
  XCTAssert(update != nil);
}

- (void)testUpdateWithEmbeddedManifest_Legacy
{
  ABI41_0_0EXUpdatesUpdate *update = [ABI41_0_0EXUpdatesUpdate updateWithEmbeddedManifest:_legacyManifest config:_configUsesLegacyManifestTrue database:_database];
  XCTAssert(update != nil);
}

- (void)testUpdateWithEmbeddedManifest_New
{
  ABI41_0_0EXUpdatesUpdate *update = [ABI41_0_0EXUpdatesUpdate updateWithEmbeddedManifest:_easNewManifest config:_configUsesLegacyManifestFalse database:_database];
  XCTAssert(update != nil);
}

- (void)testUpdateWithEmbeddedManifest_Legacy_Bare
{
  ABI41_0_0EXUpdatesUpdate *update = [ABI41_0_0EXUpdatesUpdate updateWithEmbeddedManifest:_bareManifest config:_configUsesLegacyManifestTrue database:_database];
  XCTAssert(update != nil);
}

- (void)testUpdateWithEmbeddedManifest_New_Bare
{
  ABI41_0_0EXUpdatesUpdate *update = [ABI41_0_0EXUpdatesUpdate updateWithEmbeddedManifest:_bareManifest config:_configUsesLegacyManifestFalse database:_database];
  XCTAssert(update != nil);
}

@end
