
#import <XCTest/XCTest.h>
#import "EXAppFetcherCacheOnly.h"
#import "EXAppLoader+Tests.h"
#import "EXProdServiceTestCase.h"

@interface EXAppLoaderConfigurationTestsProdService : EXProdServiceTestCase

@end

@implementation EXAppLoaderConfigurationTestsProdService

- (void)setUp
{
    [super setUp];
}

- (void)testIsOnErrorRecoveryRespectedInShellApp
{
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

@end
