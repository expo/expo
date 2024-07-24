#import <XCTest/XCTest.h>

#import "EXClientTestCase.h"
#import "EXEnvironment.h"
#import "EXFileDownloader.h"

@interface EXFileDownloaderTests : EXClientTestCase

@end

@implementation EXFileDownloaderTests

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
