//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

@import XCTest;

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesAsset.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesConfig.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesLegacyUpdate.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesUtils.h>

@interface Tests : XCTestCase

@end

@implementation Tests

- (void)testGetRuntimeVersionWithConfig
{
  ABI46_0_0EXUpdatesConfig *sdkOnlyConfig = [[ABI46_0_0EXUpdatesConfig alloc] init];
  [sdkOnlyConfig loadConfigFromDictionary:@{ @"ABI46_0_0EXUpdatesScopeKey": @"test", @"ABI46_0_0EXUpdatesSDKVersion": @"38.0.0" }];
  XCTAssert([@"38.0.0" isEqualToString:[ABI46_0_0EXUpdatesUtils getRuntimeVersionWithConfig:sdkOnlyConfig]], @"should return SDK version if no runtime version is specified");
  
  ABI46_0_0EXUpdatesConfig *runtimeOnlyConfig = [[ABI46_0_0EXUpdatesConfig alloc] init];
  [runtimeOnlyConfig loadConfigFromDictionary:@{ @"ABI46_0_0EXUpdatesScopeKey": @"test", @"ABI46_0_0EXUpdatesRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[ABI46_0_0EXUpdatesUtils getRuntimeVersionWithConfig:runtimeOnlyConfig]], @"should return runtime version if no SDK version is specified");
  
  ABI46_0_0EXUpdatesConfig *bothConfig = [[ABI46_0_0EXUpdatesConfig alloc] init];
  [bothConfig loadConfigFromDictionary:@{ @"ABI46_0_0EXUpdatesScopeKey": @"test", @"ABI46_0_0EXUpdatesSDKVersion": @"38.0.0", @"ABI46_0_0EXUpdatesRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[ABI46_0_0EXUpdatesUtils getRuntimeVersionWithConfig:bothConfig]], @"should return runtime version if both are specified");
}

- (void)testNormalizedURLOrigin
{
  NSURL *urlNoPort = [NSURL URLWithString:@"https://exp.host/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[ABI46_0_0EXUpdatesConfig normalizedURLOrigin:urlNoPort]], @"should return a normalized URL origin with no port if none is specified");

  NSURL *urlDefaultPort = [NSURL URLWithString:@"https://exp.host:443/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[ABI46_0_0EXUpdatesConfig normalizedURLOrigin:urlDefaultPort]], @"should return a normalized URL origin with no port if default port is specified");

  NSURL *urlOtherPort = [NSURL URLWithString:@"https://exp.host:47/test"];
  XCTAssert([@"https://exp.host:47" isEqualToString:[ABI46_0_0EXUpdatesConfig normalizedURLOrigin:urlOtherPort]], @"should return a normalized URL origin with port if non-default port is specified");
}

- (void)testAssetFilename
{
  ABI46_0_0EXUpdatesAsset *asset1 = [[ABI46_0_0EXUpdatesAsset alloc] initWithKey:nil type:@"bundle"];
  ABI46_0_0EXUpdatesAsset *asset2 = [[ABI46_0_0EXUpdatesAsset alloc] initWithKey:nil type:@"bundle"];
  XCTAssertNotEqualObjects(asset1.filename, asset2.filename, @"Asset filenames with null keys should be unique");

  ABI46_0_0EXUpdatesAsset *assetSetFilename = [[ABI46_0_0EXUpdatesAsset alloc] initWithKey:nil type:@"bundle"];
  NSString *filenameFromDatabase = @"filename.png";
  assetSetFilename.filename = filenameFromDatabase;
  XCTAssertEqualObjects(filenameFromDatabase, assetSetFilename.filename, @"Should be able to override the default asset filename if the database has something different");
}

- (void)testAssetFilenameWithFileExtension
{
  ABI46_0_0EXUpdatesAsset *assetWithDotPrefix = [[ABI46_0_0EXUpdatesAsset alloc] initWithKey:@"cat" type:@".jpeg"];
  XCTAssertEqualObjects(assetWithDotPrefix.filename, @"cat.jpeg");
  
  ABI46_0_0EXUpdatesAsset *assetWithoutDotPrefix = [[ABI46_0_0EXUpdatesAsset alloc] initWithKey:@"cat" type:@"jpeg"];
  XCTAssertEqualObjects(assetWithoutDotPrefix.filename, @"cat.jpeg");
  
  ABI46_0_0EXUpdatesAsset *assetWithoutKey = [[ABI46_0_0EXUpdatesAsset alloc] initWithKey:nil type:@"jpeg"];
  XCTAssertEqualObjects([assetWithoutKey.filename substringFromIndex:[assetWithoutKey.filename length] - 5], @".jpeg");
}

- (void)testAssetFilenameWithoutFileExtension
{
  ABI46_0_0EXUpdatesAsset *assetWithDotPrefix = [[ABI46_0_0EXUpdatesAsset alloc] initWithKey:@"cat" type:nil];
  XCTAssertEqualObjects(assetWithDotPrefix.filename, @"cat");

}

@end

