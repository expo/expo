//  Copyright (c) 2021 650 Industries, Inc. All rights reserved.

#import <XCTest/XCTest.h>

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesConfig.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesFileDownloader.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesUpdate.h>

@interface ABI46_0_0EXUpdatesFileDownloaderTests : XCTestCase

@end

@implementation ABI46_0_0EXUpdatesFileDownloaderTests

- (void)testCacheControl_LegacyManifest
{
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://exp.host/@test/test",
    ABI46_0_0EXUpdatesConfigRuntimeVersionKey: @"1.0",
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  NSURLRequest *actual = [downloader createManifestRequestWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"] extraHeaders:nil];
  XCTAssertEqual(NSURLRequestUseProtocolCachePolicy, actual.cachePolicy);
  XCTAssertEqualObjects(nil, [actual valueForHTTPHeaderField:@"Cache-Control"]);
}

- (void)testCacheControl_NewManifest
{
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://u.expo.dev/00000000-0000-0000-0000-000000000000",
    ABI46_0_0EXUpdatesConfigRuntimeVersionKey: @"1.0",
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  NSURLRequest *actual = [downloader createManifestRequestWithURL:[NSURL URLWithString:@"https://u.expo.dev/00000000-0000-0000-0000-000000000000"] extraHeaders:nil];
  XCTAssertEqual(NSURLRequestUseProtocolCachePolicy, actual.cachePolicy);
  XCTAssertNil([actual valueForHTTPHeaderField:@"Cache-Control"]);
}

- (void)testExtraHeaders_ObjectTypes
{
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://u.expo.dev/00000000-0000-0000-0000-000000000000",
    ABI46_0_0EXUpdatesConfigRuntimeVersionKey: @"1.0"
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  NSDictionary *extraHeaders = @{
    @"expo-string": @"test",
    @"expo-number": @(47.5),
    @"expo-boolean": @YES
  };

  NSURLRequest *actual = [downloader createManifestRequestWithURL:[NSURL URLWithString:@"https://u.expo.dev/00000000-0000-0000-0000-000000000000"] extraHeaders:extraHeaders];
  XCTAssertEqualObjects(@"test", [actual valueForHTTPHeaderField:@"expo-string"]);
  XCTAssertEqualObjects(@"47.5", [actual valueForHTTPHeaderField:@"expo-number"]);
  XCTAssertEqualObjects(@"true", [actual valueForHTTPHeaderField:@"expo-boolean"]);
}

- (void)testExtraHeaders_OverrideOrder
{
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://u.expo.dev/00000000-0000-0000-0000-000000000000",
    ABI46_0_0EXUpdatesConfigRuntimeVersionKey: @"1.0",
    ABI46_0_0EXUpdatesConfigRequestHeadersKey: @{
      // custom headers configured at build-time should be able to override preset headers
      @"expo-updates-environment": @"custom"
    }
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  // serverDefinedHeaders should not be able to override preset headers
  NSDictionary *extraHeaders = @{
    @"expo-platform": @"android"
  };

  NSURLRequest *actual = [downloader createManifestRequestWithURL:[NSURL URLWithString:@"https://u.expo.dev/00000000-0000-0000-0000-000000000000"] extraHeaders:extraHeaders];
  XCTAssertEqualObjects(@"ios", [actual valueForHTTPHeaderField:@"expo-platform"]);
  XCTAssertEqualObjects(@"custom", [actual valueForHTTPHeaderField:@"expo-updates-environment"]);
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wnonnull"
- (void)testGetExtraHeaders
{
  NSString *launchedUpdateUUIDString = @"7c1d2bd0-f88b-454d-998c-7fa92a924dbf";
  ABI46_0_0EXUpdatesUpdate *launchedUpdate = [ABI46_0_0EXUpdatesUpdate updateWithId:[[NSUUID alloc] initWithUUIDString:launchedUpdateUUIDString]
                                                         scopeKey:@"test"
                                                       commitTime:[NSDate date]
                                                   runtimeVersion:@"1.0"
                                                         manifest:nil
                                                           status:0
                                                             keep:YES
                                                           config:nil
                                                         database:nil];
  NSString *embeddedUpdateUUIDString = @"9433b1ed-4006-46b8-8aa7-fdc7eeb203fd";
  ABI46_0_0EXUpdatesUpdate *embeddedUpdate = [ABI46_0_0EXUpdatesUpdate updateWithId:[[NSUUID alloc] initWithUUIDString:embeddedUpdateUUIDString]
                                                         scopeKey:@"test"
                                                       commitTime:[NSDate date]
                                                   runtimeVersion:@"1.0"
                                                         manifest:nil
                                                           status:0
                                                             keep:YES
                                                           config:nil
                                                         database:nil];
  NSDictionary *extraHeaders = [ABI46_0_0EXUpdatesFileDownloader extraHeadersWithDatabase:nil
                                                                          config:nil
                                                                  launchedUpdate:launchedUpdate
                                                                  embeddedUpdate:embeddedUpdate];
  XCTAssertEqualObjects(launchedUpdateUUIDString, extraHeaders[@"Expo-Current-Update-ID"]);
  XCTAssertEqualObjects(embeddedUpdateUUIDString, extraHeaders[@"Expo-Embedded-Update-ID"]);
}
#pragma clang diagnostic pop

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wnonnull"
- (void)testGetExtraHeaders_NoLaunchedOrEmbeddedUpdate
{
  NSDictionary *extraHeaders = [ABI46_0_0EXUpdatesFileDownloader extraHeadersWithDatabase:nil
                                                                          config:nil
                                                                  launchedUpdate:nil
                                                                  embeddedUpdate:nil];
  XCTAssertNil(extraHeaders[@"Expo-Current-Update-ID"]);
  XCTAssertNil(extraHeaders[@"Expo-Embedded-Update-ID"]);
}
#pragma clang diagnostic pop

- (void)testAssetExtraHeaders_OverrideOrder
{
  ABI46_0_0EXUpdatesConfig *config = [ABI46_0_0EXUpdatesConfig configWithDictionary:@{
    ABI46_0_0EXUpdatesConfigUpdateUrlKey: @"https://u.expo.dev/00000000-0000-0000-0000-000000000000",
    ABI46_0_0EXUpdatesConfigRuntimeVersionKey: @"1.0",
    ABI46_0_0EXUpdatesConfigRequestHeadersKey: @{
      // custom headers configured at build-time should be able to override preset headers
      @"expo-updates-environment": @"custom"
    }
  }];
  ABI46_0_0EXUpdatesFileDownloader *downloader = [[ABI46_0_0EXUpdatesFileDownloader alloc] initWithUpdatesConfig:config];

  // assetRequestHeaders should not be able to override preset headers
  NSDictionary *extraHeaders = @{
    @"expo-platform": @"android"
  };

  NSURLRequest *actual = [downloader createGenericRequestWithURL:[NSURL URLWithString:@"https://u.expo.dev/00000000-0000-0000-0000-000000000000"] extraHeaders:extraHeaders];
  XCTAssertEqualObjects(@"ios", [actual valueForHTTPHeaderField:@"expo-platform"]);
  XCTAssertEqualObjects(@"custom", [actual valueForHTTPHeaderField:@"expo-updates-environment"]);
}

@end
