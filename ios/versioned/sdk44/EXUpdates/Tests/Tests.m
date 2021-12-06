//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

@import XCTest;

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAsset.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesConfig.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesLegacyUpdate.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUtils.h>

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
  ABI44_0_0EXUpdatesConfig *sdkOnlyConfig = [[ABI44_0_0EXUpdatesConfig alloc] init];
  [sdkOnlyConfig loadConfigFromDictionary:@{ @"ABI44_0_0EXUpdatesScopeKey": @"test", @"ABI44_0_0EXUpdatesSDKVersion": @"38.0.0" }];
  XCTAssert([@"38.0.0" isEqualToString:[ABI44_0_0EXUpdatesUtils getRuntimeVersionWithConfig:sdkOnlyConfig]], @"should return SDK version if no runtime version is specified");
  
  ABI44_0_0EXUpdatesConfig *runtimeOnlyConfig = [[ABI44_0_0EXUpdatesConfig alloc] init];
  [runtimeOnlyConfig loadConfigFromDictionary:@{ @"ABI44_0_0EXUpdatesScopeKey": @"test", @"ABI44_0_0EXUpdatesRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[ABI44_0_0EXUpdatesUtils getRuntimeVersionWithConfig:runtimeOnlyConfig]], @"should return runtime version if no SDK version is specified");
  
  ABI44_0_0EXUpdatesConfig *bothConfig = [[ABI44_0_0EXUpdatesConfig alloc] init];
  [bothConfig loadConfigFromDictionary:@{ @"ABI44_0_0EXUpdatesScopeKey": @"test", @"ABI44_0_0EXUpdatesSDKVersion": @"38.0.0", @"ABI44_0_0EXUpdatesRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[ABI44_0_0EXUpdatesUtils getRuntimeVersionWithConfig:bothConfig]], @"should return runtime version if both are specified");
}

- (void)testNormalizedURLOrigin
{
  NSURL *urlNoPort = [NSURL URLWithString:@"https://exp.host/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[ABI44_0_0EXUpdatesConfig normalizedURLOrigin:urlNoPort]], @"should return a normalized URL origin with no port if none is specified");

  NSURL *urlDefaultPort = [NSURL URLWithString:@"https://exp.host:443/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[ABI44_0_0EXUpdatesConfig normalizedURLOrigin:urlDefaultPort]], @"should return a normalized URL origin with no port if default port is specified");

  NSURL *urlOtherPort = [NSURL URLWithString:@"https://exp.host:47/test"];
  XCTAssert([@"https://exp.host:47" isEqualToString:[ABI44_0_0EXUpdatesConfig normalizedURLOrigin:urlOtherPort]], @"should return a normalized URL origin with port if non-default port is specified");
}

- (void)testAssetFilename
{
  ABI44_0_0EXUpdatesAsset *asset1 = [[ABI44_0_0EXUpdatesAsset alloc] initWithKey:nil type:@"bundle"];
  ABI44_0_0EXUpdatesAsset *asset2 = [[ABI44_0_0EXUpdatesAsset alloc] initWithKey:nil type:@"bundle"];
  XCTAssertNotEqualObjects(asset1.filename, asset2.filename, @"Asset filenames with null keys should be unique");

  ABI44_0_0EXUpdatesAsset *assetSetFilename = [[ABI44_0_0EXUpdatesAsset alloc] initWithKey:nil type:@"bundle"];
  NSString *filenameFromDatabase = @"filename.png";
  assetSetFilename.filename = filenameFromDatabase;
  XCTAssertEqualObjects(filenameFromDatabase, assetSetFilename.filename, @"Should be able to override the default asset filename if the database has something different");
}

- (void)testAssetFilenameWithFileExtension
{
  ABI44_0_0EXUpdatesAsset *assetWithDotPrefix = [[ABI44_0_0EXUpdatesAsset alloc] initWithKey:@"cat" type:@".jpeg"];
  XCTAssertEqualObjects(assetWithDotPrefix.filename, @"cat.jpeg");
  
  ABI44_0_0EXUpdatesAsset *assetWithoutDotPrefix = [[ABI44_0_0EXUpdatesAsset alloc] initWithKey:@"cat" type:@"jpeg"];
  XCTAssertEqualObjects(assetWithoutDotPrefix.filename, @"cat.jpeg");
  
  ABI44_0_0EXUpdatesAsset *assetWithoutKey = [[ABI44_0_0EXUpdatesAsset alloc] initWithKey:nil type:@"jpeg"];
  XCTAssertEqualObjects([assetWithoutKey.filename substringFromIndex:[assetWithoutKey.filename length] - 5], @".jpeg");
}

- (void)testAssetFilenameWithoutFileExtension
{
  ABI44_0_0EXUpdatesAsset *assetWithDotPrefix = [[ABI44_0_0EXUpdatesAsset alloc] initWithKey:@"cat" type:nil];
  XCTAssertEqualObjects(assetWithDotPrefix.filename, @"cat");

}

@end

