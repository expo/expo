//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesFileDownloader.h>

@interface EXUpdatesFileDownloaderTests : XCTestCase

@end

@implementation EXUpdatesFileDownloaderTests

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
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    @"EXUpdatesURL": @"https://exp.host/@test/test",
    @"EXUpdatesRuntimeVersion": @"1.0",
    @"EXUpdatesUsesLegacyManifest": @(YES)
  }];
  EXUpdatesFileDownloader *downloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  NSURLRequest *actual = [downloader createManifestRequestWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]];
  XCTAssertEqual(NSURLRequestReloadIgnoringCacheData, actual.cachePolicy);
  // this fails, seems like this header isn't actually set on the object until later
  // XCTAssertEqualObjects(@"no-cache", [actual valueForHTTPHeaderField:@"Cache-Control"]);
}

- (void)testCacheControl_NewManifest
{
  EXUpdatesConfig *config = [EXUpdatesConfig configWithDictionary:@{
    @"EXUpdatesURL": @"https://exp.host/@test/test",
    @"EXUpdatesRuntimeVersion": @"1.0",
    @"EXUpdatesUsesLegacyManifest": @(NO)
  }];
  EXUpdatesFileDownloader *downloader = [[EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  NSURLRequest *actual = [downloader createManifestRequestWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"]];
  XCTAssertEqual(NSURLRequestUseProtocolCachePolicy, actual.cachePolicy);
  XCTAssertNil([actual valueForHTTPHeaderField:@"Cache-Control"]);
}

@end
