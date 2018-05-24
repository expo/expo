
#import <XCTest/XCTest.h>

#import "EXAppLoader.h"
#import "EXAppFetcherCacheOnly.h"
#import "EXAppFetcherWithTimeout.h"
#import "EXEnvironment.h"
#import "EXFileDownloader.h"
#import "EXEnvironmentMocks.h"

#pragma mark - private/internal methods in App Loader & App Fetchers

@interface EXAppLoader (EXAppLoaderTests)

@property (nonatomic, readonly) EXAppFetcher * _Nullable appFetcher;

- (BOOL)_fetchBundleWithManifest:(NSDictionary *)manifest;

@end

@interface EXAppFetcherWithTimeout (EXAppLoaderTests)

@property (nonatomic, readonly) NSTimeInterval timeout;

@end

@interface EXAppLoaderTests : XCTestCase

@end

@implementation EXAppLoaderTests

- (void)setUp
{
  [super setUp];
  
  if ([EXEnvironment sharedEnvironment].testEnvironment == EXTestEnvironmentNone) {
    [EXEnvironment sharedEnvironment].testEnvironment = EXTestEnvironmentLocal;
  }
}

#pragma mark - file downloader

- (void)testIsExpoSDKVersionHeaderConfigured
{
  NSURLRequest *request = [self _mockJsBundleDownloadRequest];
  NSString *sdkVersionHeader = [request valueForHTTPHeaderField:@"Exponent-SDK-Version"];
  NSArray *sdkVersions = [sdkVersionHeader componentsSeparatedByString:@","];
  XCTAssert(sdkVersions.count > 0, @"Expo SDK version header should contain at least one comma-separated SDK version");
}

- (void)testAreOtherHeadersConfigured
{
  NSURLRequest *request = [self _mockJsBundleDownloadRequest];
  NSArray<NSString *> *requiredHeaderFields = @[
    @"Exponent-SDK-Version",
    @"Exponent-Platform",
    @"Exponent-Accept-Signature",
  ];
  for (NSString *header in requiredHeaderFields) {
    NSString *headerValue = [request valueForHTTPHeaderField:header];
    XCTAssert((headerValue != nil), @"HTTP header %@ should be set", header);
  }
}

- (void)testDoesDefaultFileDownloaderDownloadSomething
{
  XCTestExpectation *expectToDownload = [[XCTestExpectation alloc] initWithDescription:@"Default EXFileDownloader should download a json file"];
  EXFileDownloader *fileDownloader = [[EXFileDownloader alloc] init];
  NSURL *jsonFileUrl = [NSURL URLWithString:@"https://expo.io/@exponent/home/index.exp"];
  [fileDownloader downloadFileFromURL:jsonFileUrl successBlock:^(NSData * _Nonnull data, NSURLResponse * _Nonnull response) {
    [expectToDownload fulfill];
  } errorBlock:^(NSError * _Nonnull error, NSURLResponse * _Nonnull response) {}];
  [self waitForExpectations:@[ expectToDownload ] timeout:10.0];
}

#pragma mark - app loader configuration in app.json

- (void)testIsDefaultUpdatesConfigUsed
{
  NSDictionary *manifest = @{};
  EXAppLoader *appLoader = [[EXAppLoader alloc] initWithManifestUrl:[NSURL URLWithString:@"exp://exp.host/@esamelson/test-fetch-update"]];
  [appLoader _fetchBundleWithManifest:manifest];
  XCTAssert([appLoader.appFetcher isKindOfClass:[EXAppFetcherWithTimeout class]], @"AppLoader should choose to use AppFetcherWithTimeout when fetching remotely");
  XCTAssert([(EXAppFetcherWithTimeout *)appLoader.appFetcher timeout] == kEXAppLoaderDefaultTimeout, @"AppFetcherWithTimeout should have the correct user-specified timeout length");
}

- (void)testIsUpdateTimeoutConfigRespected
{
  NSDictionary *manifest = @{
    @"updates": @{
      @"fallbackToCacheTimeout": @1000,
    }
  };
  EXAppLoader *appLoader = [[EXAppLoader alloc] initWithManifestUrl:[NSURL URLWithString:@"exp://exp.host/@esamelson/test-fetch-update"]];
  [appLoader _fetchBundleWithManifest:manifest];
  XCTAssert([appLoader.appFetcher isKindOfClass:[EXAppFetcherWithTimeout class]], @"AppLoader should choose to use AppFetcherWithTimeout when fetching remotely");
  XCTAssert([(EXAppFetcherWithTimeout *)appLoader.appFetcher timeout] == 1.0f, @"AppFetcherWithTimeout should have the correct user-specified timeout length");
}

- (void)testIsOnErrorRecoveryIgnoredInExpoClient
{
  [EXShellManagerMocks loadExpoClientConfig];
  NSDictionary *manifest = @{
    @"updates": @{
      @"checkAutomatically": @"ON_ERROR_RECOVERY"
    }
  };
  EXAppLoader *appLoader = [[EXAppLoader alloc] initWithManifestUrl:[NSURL URLWithString:@"exp://exp.host/@esamelson/test-fetch-update"]];
  [appLoader _fetchBundleWithManifest:manifest];
  XCTAssert([appLoader.appFetcher isKindOfClass:[EXAppFetcherWithTimeout class]], @"AppLoader should ignore ON_ERROR_RECOVERY in the Expo client");
}

- (void)testIsOnErrorRecoveryRespectedInShellApp
{
  [EXShellManagerMocks loadProdServiceConfig];
  NSDictionary *manifest = @{
    @"updates": @{
      @"checkAutomatically": @"ON_ERROR_RECOVERY"
    },
    @"bundleUrl": @"https://d1wp6m56sqw74a.cloudfront.net/%40esamelson%2Ftest-fetch-update%2F1.0.0%2Fddf3e9977eedb14313d242302df6cf70-27.0.0-ios.js", // value doesn't matter
  };
  EXAppLoader *appLoader = [[EXAppLoader alloc] initWithManifestUrl:[NSURL URLWithString:@"exp://exp.host/@esamelson/test-fetch-update"]];
  [appLoader _fetchBundleWithManifest:manifest];
  XCTAssert([appLoader.appFetcher isKindOfClass:[EXAppFetcherCacheOnly class]], @"AppLoader should choose to use AppFetcherCacheOnly in a shell app with ON_ERROR_RECOVERY");
}

#pragma mark - internal

- (NSMutableURLRequest *)_mockJsBundleDownloadRequest
{
  // mock a url request for a JS bundle
  NSMutableURLRequest *jsBundleDownloadRequest = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"https://exp.host/@exponent/home/bundle"]];
  EXFileDownloader *downloader = [[EXFileDownloader alloc] init];
  [downloader setHTTPHeaderFields:jsBundleDownloadRequest];
  return jsBundleDownloadRequest;
}

@end
