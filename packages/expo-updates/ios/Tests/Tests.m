//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

@import XCTest;

#import <EXUpdates/EXUpdatesUtils.h>

#import "EXUpdates-Swift.h"

@interface Tests : XCTestCase

@end

@implementation Tests

- (void)testGetRuntimeVersionWithConfig
{
  EXUpdatesConfig *sdkOnlyConfig = [EXUpdatesConfig configFromDictionary:@{ @"EXUpdatesScopeKey": @"test", @"EXUpdatesSDKVersion": @"38.0.0" }];
  XCTAssert([@"38.0.0" isEqualToString:[EXUpdatesUtils getRuntimeVersionWithConfig:sdkOnlyConfig]], @"should return SDK version if no runtime version is specified");
  
  EXUpdatesConfig *runtimeOnlyConfig = [EXUpdatesConfig configFromDictionary:@{ @"EXUpdatesScopeKey": @"test", @"EXUpdatesRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[EXUpdatesUtils getRuntimeVersionWithConfig:runtimeOnlyConfig]], @"should return runtime version if no SDK version is specified");
  
  EXUpdatesConfig *bothConfig = [EXUpdatesConfig configFromDictionary:@{ @"EXUpdatesScopeKey": @"test", @"EXUpdatesSDKVersion": @"38.0.0", @"EXUpdatesRuntimeVersion": @"1.0" }];
  XCTAssert([@"1.0" isEqualToString:[EXUpdatesUtils getRuntimeVersionWithConfig:bothConfig]], @"should return runtime version if both are specified");
}

- (void)testNormalizedURLOrigin
{
  NSURL *urlNoPort = [NSURL URLWithString:@"https://exp.host/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[EXUpdatesConfig normalizedURLOriginWithUrl:urlNoPort]], @"should return a normalized URL origin with no port if none is specified");

  NSURL *urlDefaultPort = [NSURL URLWithString:@"https://exp.host:443/test"];
  XCTAssert([@"https://exp.host" isEqualToString:[EXUpdatesConfig normalizedURLOriginWithUrl:urlDefaultPort]], @"should return a normalized URL origin with no port if default port is specified");

  NSURL *urlOtherPort = [NSURL URLWithString:@"https://exp.host:47/test"];
  XCTAssert([@"https://exp.host:47" isEqualToString:[EXUpdatesConfig normalizedURLOriginWithUrl:urlOtherPort]], @"should return a normalized URL origin with port if non-default port is specified");
}

- (void)testAssetFilename
{
  EXUpdatesAsset *asset1 = [[EXUpdatesAsset alloc] initWithKey:nil type:@"bundle"];
  EXUpdatesAsset *asset2 = [[EXUpdatesAsset alloc] initWithKey:nil type:@"bundle"];
  XCTAssertNotEqualObjects(asset1.filename, asset2.filename, @"Asset filenames with null keys should be unique");

  EXUpdatesAsset *assetSetFilename = [[EXUpdatesAsset alloc] initWithKey:nil type:@"bundle"];
  NSString *filenameFromDatabase = @"filename.png";
  assetSetFilename.filename = filenameFromDatabase;
  XCTAssertEqualObjects(filenameFromDatabase, assetSetFilename.filename, @"Should be able to override the default asset filename if the database has something different");
}

- (void)testAssetFilenameWithFileExtension
{
  EXUpdatesAsset *assetWithDotPrefix = [[EXUpdatesAsset alloc] initWithKey:@"cat" type:@".jpeg"];
  XCTAssertEqualObjects(assetWithDotPrefix.filename, @"cat.jpeg");
  
  EXUpdatesAsset *assetWithoutDotPrefix = [[EXUpdatesAsset alloc] initWithKey:@"cat" type:@"jpeg"];
  XCTAssertEqualObjects(assetWithoutDotPrefix.filename, @"cat.jpeg");
  
  EXUpdatesAsset *assetWithoutKey = [[EXUpdatesAsset alloc] initWithKey:nil type:@"jpeg"];
  XCTAssertEqualObjects([assetWithoutKey.filename substringFromIndex:[assetWithoutKey.filename length] - 5], @".jpeg");
}

- (void)testAssetFilenameWithoutFileExtension
{
  EXUpdatesAsset *assetWithDotPrefix = [[EXUpdatesAsset alloc] initWithKey:@"cat" type:nil];
  XCTAssertEqualObjects(assetWithDotPrefix.filename, @"cat");

}

@end

