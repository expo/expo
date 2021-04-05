//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesBareUpdate.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesLegacyUpdate.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesUpdate.h>

@interface EXUpdatesUpdateTests : XCTestCase

@property (nonatomic, strong) NSDictionary *legacyManifest;
@property (nonatomic, strong) NSDictionary *easNewManifest;
@property (nonatomic, strong) NSDictionary *bareManifest;

@property (nonatomic, strong) EXUpdatesConfig *config;
@property (nonatomic, strong) EXUpdatesDatabase *database;

@end

@implementation EXUpdatesUpdateTests

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

  _config = [EXUpdatesConfig configWithDictionary:@{
    @"EXUpdatesURL": @"https://exp.host/@test/test",
  }];

  _database = [EXUpdatesDatabase new];
}

- (void)tearDown
{
  [super tearDown];
}

- (void)testUpdateWithManifest_Legacy
{
  NSError *error;
  NSURLResponse* response =  [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://example.com"] statusCode:200 HTTPVersion:nil headerFields:@{}];

  EXUpdatesUpdate *update = [EXUpdatesUpdate updateWithManifest:_legacyManifest response:response config:_config database:_database error:&error];
  XCTAssert(update != nil);
}

- (void)testUpdateWithManifest_New
{
  NSError *error;
  NSURLResponse* response =  [[NSHTTPURLResponse alloc] initWithURL:[NSURL URLWithString:@"https://example.com"] statusCode:200 HTTPVersion:nil headerFields:@{@"expo-protocol-version" : @"0"}];

  EXUpdatesUpdate *update = [EXUpdatesUpdate updateWithManifest:_easNewManifest response:response config:_config database:_database error:&error];
  XCTAssert(update != nil);
}

- (void)testUpdateWithEmbeddedManifest_Legacy
{
  EXUpdatesUpdate *update = [EXUpdatesUpdate updateWithEmbeddedManifest:_legacyManifest config:_config database:_database];
  XCTAssert(update != nil);
}

- (void)testUpdateWithEmbeddedManifest_Legacy_Bare
{
  EXUpdatesUpdate *update = [EXUpdatesUpdate updateWithEmbeddedManifest:_bareManifest config:_config database:_database];
  XCTAssert(update != nil);
}

@end
