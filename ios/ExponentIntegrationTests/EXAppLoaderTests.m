
#import <XCTest/XCTest.h>

#import "EXAppLoader.h"
#import "EXAppFetcherCacheOnly.h"
#import "EXAppFetcherWithTimeout.h"
#import "EXFileDownloader.h"
#import "EXShellManager.h"

#pragma mark - private/internal methods in App Loader & App Fetchers

@interface EXAppLoader (EXAppLoaderTests)

@property (nonatomic, readonly) EXAppFetcher * _Nullable appFetcher;

- (BOOL)_fetchBundleWithManifest:(NSDictionary *)manifest;

@end

@interface EXAppFetcherWithTimeout (EXAppLoaderTests)

@property (nonatomic, readonly) NSUInteger timeoutLengthInMs;

@end

@interface EXAppLoaderTests : XCTestCase

@property (nonatomic, strong) NSMutableURLRequest *jsBundleDownloadRequest;

@end

@implementation EXAppLoaderTests

- (void)setUp
{
  [super setUp];
  
  // mock a url request for a JS bundle
  _jsBundleDownloadRequest = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"https://exp.host/@exponent/home/bundle"]];
  EXFileDownloader *downloader = [[EXFileDownloader alloc] init];
  [downloader setHTTPHeaderFields:_jsBundleDownloadRequest];
}

#pragma mark - file downloader

- (void)testIsExpoSDKVersionHeaderConfigured
{
  NSString *sdkVersionHeader = [_jsBundleDownloadRequest valueForHTTPHeaderField:@"Exponent-SDK-Version"];
  NSArray *sdkVersions = [sdkVersionHeader componentsSeparatedByString:@","];
  XCTAssert(sdkVersions.count > 0, @"Expo SDK version header should contain at least one comma-separated SDK version");
}

- (void)testAreOtherHeadersConfigured
{
  NSArray<NSString *> *requiredHeaderFields = @[
    @"Exponent-SDK-Version",
    @"Exponent-Platform",
    @"Exponent-Accept-Signature",
  ];
  for (NSString *header in requiredHeaderFields) {
    NSString *headerValue = [_jsBundleDownloadRequest valueForHTTPHeaderField:header];
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

#pragma mark - app loader

- (void)testIsDefaultUpdatesConfigUsed
{
  NSDictionary *manifest = @{};
  EXAppLoader *appLoader = [[EXAppLoader alloc] initWithManifestUrl:[NSURL URLWithString:@"exp://exp.host/@esamelson/test-fetch-update"]];
  [appLoader _fetchBundleWithManifest:manifest];
  XCTAssert([appLoader.appFetcher isKindOfClass:[EXAppFetcherWithTimeout class]], @"AppLoader should choose to use AppFetcherWithTimeout when fetching remotely");
  XCTAssert([(EXAppFetcherWithTimeout *)appLoader.appFetcher timeoutLengthInMs] == 30000, @"AppFetcherWithTimeout should have the correct user-specified timeout length");
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
  XCTAssert([(EXAppFetcherWithTimeout *)appLoader.appFetcher timeoutLengthInMs] == 1000, @"AppFetcherWithTimeout should have the correct user-specified timeout length");
}

- (void)testIsUpdateAutomaticallyConfigRespected
{
  NSDictionary *manifest = @{
                             @"updates": @{
                                 @"checkAutomatically": @"ON_ERROR_RECOVERY"
                                 }
                             };
  EXAppLoader *appLoader = [[EXAppLoader alloc] initWithManifestUrl:[NSURL URLWithString:@"exp://exp.host/@esamelson/test-fetch-update"]];
  [appLoader _fetchBundleWithManifest:manifest];
  if ([EXShellManager sharedInstance].isShell) {
    XCTAssert([appLoader.appFetcher isKindOfClass:[EXAppFetcherCacheOnly class]], @"AppLoader should choose to use AppFetcherCacheOnly in a shell app with ON_ERROR_RECOVERY");
  } else {
    XCTAssert([appLoader.appFetcher isKindOfClass:[EXAppFetcherWithTimeout class]], @"AppLoader should ignore ON_ERROR_RECOVERY in the Expo client");
  }
}

@end
