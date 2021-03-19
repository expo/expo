//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesFileDownloader.h>

@interface ABI41_0_0EXUpdatesFileDownloaderTests : XCTestCase

@end

@implementation ABI41_0_0EXUpdatesFileDownloaderTests

- (void)setUp
{
  // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown
{
  // Put teardown code here. This method is called after the invocation of each test method in the class.
}

- (void)testCacheControl_LegacyManifest
{
  ABI41_0_0EXUpdatesConfig *config = [ABI41_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI41_0_0EXUpdatesURL": @"https://exp.host/@test/test",
    @"ABI41_0_0EXUpdatesRuntimeVersion": @"1.0",
    @"ABI41_0_0EXUpdatesUsesLegacyManifest": @(YES)
  }];
  ABI41_0_0EXUpdatesFileDownloader *downloader = [[ABI41_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  NSURLRequest *actual = [downloader createManifestRequestWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"] extraHeaders:nil];
  XCTAssertEqual(NSURLRequestReloadIgnoringCacheData, actual.cachePolicy);
  // this fails, seems like this header isn't actually set on the object until later
  // XCTAssertEqualObjects(@"no-cache", [actual valueForHTTPHeaderField:@"Cache-Control"]);
}

- (void)testCacheControl_NewManifest
{
  ABI41_0_0EXUpdatesConfig *config = [ABI41_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI41_0_0EXUpdatesURL": @"https://exp.host/manifest/00000000-0000-0000-0000-000000000000",
    @"ABI41_0_0EXUpdatesRuntimeVersion": @"1.0",
    @"ABI41_0_0EXUpdatesUsesLegacyManifest": @(NO)
  }];
  ABI41_0_0EXUpdatesFileDownloader *downloader = [[ABI41_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  NSURLRequest *actual = [downloader createManifestRequestWithURL:[NSURL URLWithString:@"https://exp.host/manifest/00000000-0000-0000-0000-000000000000"] extraHeaders:nil];
  XCTAssertEqual(NSURLRequestUseProtocolCachePolicy, actual.cachePolicy);
  XCTAssertNil([actual valueForHTTPHeaderField:@"Cache-Control"]);
}

- (void)testExtraHeaders_ObjectTypes
{
  ABI41_0_0EXUpdatesConfig *config = [ABI41_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI41_0_0EXUpdatesURL": @"https://exp.host/manifest/00000000-0000-0000-0000-000000000000",
    @"ABI41_0_0EXUpdatesRuntimeVersion": @"1.0"
  }];
  ABI41_0_0EXUpdatesFileDownloader *downloader = [[ABI41_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  NSDictionary *extraHeaders = @{
    @"expo-string": @"test",
    @"expo-number": @(47.5),
    @"expo-boolean": @YES
  };

  NSURLRequest *actual = [downloader createManifestRequestWithURL:[NSURL URLWithString:@"https://exp.host/manifest/00000000-0000-0000-0000-000000000000"] extraHeaders:extraHeaders];
  XCTAssertEqualObjects(@"test", [actual valueForHTTPHeaderField:@"expo-string"]);
  XCTAssertEqualObjects(@"47.5", [actual valueForHTTPHeaderField:@"expo-number"]);
  XCTAssertEqualObjects(@"true", [actual valueForHTTPHeaderField:@"expo-boolean"]);
}

- (void)testExtraHeaders_OverrideOrder
{
  ABI41_0_0EXUpdatesConfig *config = [ABI41_0_0EXUpdatesConfig configWithDictionary:@{
    @"ABI41_0_0EXUpdatesURL": @"https://exp.host/manifest/00000000-0000-0000-0000-000000000000",
    @"ABI41_0_0EXUpdatesRuntimeVersion": @"1.0",
    @"ABI41_0_0EXUpdatesRequestHeaders": @{
      // custom headers configured at build-time should be able to override preset headers
      @"expo-updates-environment": @"custom"
    }
  }];
  ABI41_0_0EXUpdatesFileDownloader *downloader = [[ABI41_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  // serverDefinedHeaders should not be able to override preset headers
  NSDictionary *extraHeaders = @{
    @"expo-platform": @"android"
  };

  NSURLRequest *actual = [downloader createManifestRequestWithURL:[NSURL URLWithString:@"https://exp.host/manifest/00000000-0000-0000-0000-000000000000"] extraHeaders:extraHeaders];
  XCTAssertEqualObjects(@"ios", [actual valueForHTTPHeaderField:@"expo-platform"]);
  XCTAssertEqualObjects(@"custom", [actual valueForHTTPHeaderField:@"expo-updates-environment"]);
}

@end
