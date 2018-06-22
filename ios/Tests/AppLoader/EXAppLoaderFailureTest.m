
#import <XCTest/XCTest.h>

#import "EXAppLoader+Tests.h"

@interface EXAppLoaderFailureTest : XCTestCase <EXAppLoaderDelegate>

@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) XCTestExpectation *callingExpectation;
@property (nonatomic, strong) EXAppLoader *appLoader;
@property (nonatomic, strong) XCTestExpectation *expectToFail;

@end

@implementation EXAppLoaderFailureTest

- (instancetype)initWithUrl:(NSURL *)urlExpectingToFail expectation:(XCTestExpectation *)expectation
{
  if (self = [super init]) {
    _url = urlExpectingToFail;
    _callingExpectation = expectation;
  }
  return self;
}

- (void)requestAndExpectToFail
{
  _expectToFail = [self expectationWithDescription:@"App loader should call the failure delegate method"];
  _appLoader = [[EXAppLoader alloc] initWithManifestUrl:_url];
  _appLoader.delegate = self;
  [_appLoader request];
  [self waitForExpectationsWithTimeout:10.0f handler:^(NSError * _Nullable error) {
    if (error) {
      XCTAssert(NO, @"EXAppLoader should fail when loading an invalid app, but instead the test errored or timed out: %@", error.localizedDescription);
    } else {
      XCTAssert(self->_appLoader.appFetcher != nil, @"App loader should preserve app fetcher state after failure");
      [self->_callingExpectation fulfill];
    }
  }];
}

#pragma mark - AppLoaderDelegate

- (void)appLoader:(EXAppLoader *)appLoader didLoadOptimisticManifest:(NSDictionary *)manifest
{
  
}
- (void)appLoader:(EXAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress
{
  XCTAssert(NO, @"App loader should not provide bundle progress for an invalid url");
}
- (void)appLoader:(EXAppLoader *)appLoader didFinishLoadingManifest:(NSDictionary *)manifest bundle:(NSData *)data
{
  XCTAssert(NO, @"App loader should not succeed for an invalid url");
}
- (void)appLoader:(EXAppLoader *)appLoader didFailWithError:(NSError *)error
{
  [_expectToFail fulfill];
}
- (void)appLoader:(EXAppLoader *)appLoader didResolveUpdatedBundleWithManifest:(NSDictionary * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error
{
  
}

@end
