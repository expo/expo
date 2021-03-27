//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

@import XCTest;

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncAsset.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncLegacyManifest.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncUtils.h>

@interface Tests : XCTestCase

@end

@implementation Tests

- (void)setUp
{
    [super setUp];
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown
{
    // Put teardown code here. This method is called after the invocation of each test method in the class.
    [super tearDown];
}

- (void)testGetRuntimeVersionWithConfig
{
  ABI41_0_0EXSyncConfig *sdkOnlyConfig = [[ABI41_0_0EXSyncConfig alloc] init];
  [sdkOnlyConfig loadConfigFromDictionary:@{ @"ABI41_0_0EXSyncScopeKey": @"test", @"ABI41_0_0EXSyncSDKVersion": @"38.0.0" }];
  XCTAssert([@"38.0.0" isEqualToString:[ABI41_0_0EXSyncUtils getRuntimeVersionWithConfig:sdkOnlyConfig]], @"should return SDK version if no runtime version is specified");
  
  ABI41_0_0EXSyncConfig *runtimeOnlyConfig = [[ABI41_0_0EXSyncConfig alloc] init];
  [runtimeOnlyConfig loadConfigFromDictionary:@{ @"ABI41_0_0EXSyncScopeKey": @"test", @"ABI41_0_0EXSyncRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[ABI41_0_0EXSyncUtils getRuntimeVersionWithConfig:runtimeOnlyConfig]], @"should return runtime version if no SDK version is specified");
  
  ABI41_0_0EXSyncConfig *bothConfig = [[ABI41_0_0EXSyncConfig alloc] init];
  [bothConfig loadConfigFromDictionary:@{ @"ABI41_0_0EXSyncScopeKey": @"test", @"ABI41_0_0EXSyncSDKVersion": @"38.0.0", @"ABI41_0_0EXSyncRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[ABI41_0_0EXSyncUtils getRuntimeVersionWithConfig:bothConfig]], @"should return runtime version if both are specified");
}

- (void)testNormalizedURLOrigin
{
  NSURL *urlNoPort = [NSURL URLWithString:@"https://exp.host/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[ABI41_0_0EXSyncConfig normalizedURLOrigin:urlNoPort]], @"should return a normalized URL origin with no port if none is specified");

  NSURL *urlDefaultPort = [NSURL URLWithString:@"https://exp.host:443/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[ABI41_0_0EXSyncConfig normalizedURLOrigin:urlDefaultPort]], @"should return a normalized URL origin with no port if default port is specified");

  NSURL *urlOtherPort = [NSURL URLWithString:@"https://exp.host:47/test"];
  XCTAssert([@"https://exp.host:47" isEqualToString:[ABI41_0_0EXSyncConfig normalizedURLOrigin:urlOtherPort]], @"should return a normalized URL origin with port if non-default port is specified");
}

- (void)testAssetFilename
{
  ABI41_0_0EXSyncAsset *asset1 = [[ABI41_0_0EXSyncAsset alloc] initWithKey:nil type:@"bundle"];
  ABI41_0_0EXSyncAsset *asset2 = [[ABI41_0_0EXSyncAsset alloc] initWithKey:nil type:@"bundle"];
  XCTAssertNotEqualObjects(asset1.filename, asset2.filename, @"Asset filenames with null keys should be unique");

  ABI41_0_0EXSyncAsset *assetSetFilename = [[ABI41_0_0EXSyncAsset alloc] initWithKey:nil type:@"bundle"];
  NSString *filenameFromDatabase = @"filename.png";
  assetSetFilename.filename = filenameFromDatabase;
  XCTAssertEqualObjects(filenameFromDatabase, assetSetFilename.filename, @"Should be able to override the default asset filename if the database has something different");
}

@end

