
#import <XCTest/XCTest.h>

#import "EXAppLoader+Tests.h"

@interface EXAppLoaderDelegateTest : XCTestCase <EXAppLoaderDelegate>

@property (nonatomic, strong) EXAppLoader *appLoader;
@property (nonatomic, strong) XCTestExpectation *expectToFail;

@end

@implementation EXAppLoaderDelegateTest

- (void)testIsErrorStateMaintainedAfterFailure
{
  _expectToFail = [self expectationWithDescription:@"App loader failed"];
  _appLoader = [[EXAppLoader alloc] initWithManifestUrl:[NSURL URLWithString:@"exp://exp.host/@ben/test-sdk20"]];
  _appLoader.delegate = self;
  [_appLoader request];
  [self waitForExpectationsWithTimeout:5.0f handler:^(NSError * _Nullable error) {
    if (error) {
      XCTAssert(NO, @"Test errored: %@", error.localizedDescription);
    } else {
      XCTAssert(self->_appLoader.appFetcher != nil, @"App loader should preserve app fetcher state after failure");
    }
  }];
}

#pragma mark - AppLoaderDelegate

- (void)appLoader:(EXAppLoader *)appLoader didLoadOptimisticManifest:(NSDictionary *)manifest
{
  
}
- (void)appLoader:(EXAppLoader *)appLoader didLoadBundleWithProgress:(EXLoadingProgress *)progress
{
  
}
- (void)appLoader:(EXAppLoader *)appLoader didFinishLoadingManifest:(NSDictionary *)manifest bundle:(NSData *)data
{
  
}
- (void)appLoader:(EXAppLoader *)appLoader didFailWithError:(NSError *)error
{
  [_expectToFail fulfill];
}
- (void)appLoader:(EXAppLoader *)appLoader didResolveUpdatedBundleWithManifest:(NSDictionary * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error
{
  
}

@end
