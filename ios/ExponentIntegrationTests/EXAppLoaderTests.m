
#import <XCTest/XCTest.h>

#import "EXFileDownloader.h"

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

@end
