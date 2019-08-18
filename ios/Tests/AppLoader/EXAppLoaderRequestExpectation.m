
#import <XCTest/XCTest.h>

#import "EXAppLoader+Tests.h"
#import "EXAppLoaderRequestExpectation.h"

@interface EXAppLoaderRequestExpectation () <EXAppLoaderDelegate>

@property (nonatomic, strong) NSURL *url;
@property (nonatomic, strong) XCTestExpectation *expectToSucceed;
@property (nonatomic, strong) XCTestExpectation *expectToFail;
@property (nonatomic, strong) EXAppLoader *appLoader;

@end

@implementation EXAppLoaderRequestExpectation

- (instancetype)initWithUrl:(NSURL *)url expectToSucceed:(XCTestExpectation *)expectToSucceed expectToFail:(XCTestExpectation *)expectToFail
{
  if (self = [super init]) {
    _url = url;
    _expectToSucceed = expectToSucceed;
    _expectToFail = expectToFail;
    _appLoader = [[EXAppLoader alloc] initWithManifestUrl:_url];
    _appLoader.delegate = self;
  }
  return self;
}

- (void)request
{
  [_appLoader request];
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
  [_expectToSucceed fulfill];
}

- (void)appLoader:(EXAppLoader *)appLoader didFailWithError:(NSError *)error
{
  [_expectToFail fulfill];
}

- (void)appLoader:(EXAppLoader *)appLoader didResolveUpdatedBundleWithManifest:(NSDictionary * _Nullable)manifest isFromCache:(BOOL)isFromCache error:(NSError * _Nullable)error
{
  
}

@end
