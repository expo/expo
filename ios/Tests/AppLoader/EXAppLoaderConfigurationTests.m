#import <XCTest/XCTest.h>

#import "EXAppLoader+Tests.h"
#import "EXAppFetcherWithTimeout.h"
#import "EXClientTestCase.h"
#import "EXEnvironment.h"

@interface EXAppFetcherWithTimeout (EXAppLoaderTests)

@property (nonatomic, readonly) NSTimeInterval timeout;

@end

@interface EXAppLoaderConfigurationTests : EXClientTestCase

@end

@implementation EXAppLoaderConfigurationTests

- (void)setUp
{
  [super setUp];
  
  if ([EXEnvironment sharedEnvironment].testEnvironment == EXTestEnvironmentNone) {
    [EXEnvironment sharedEnvironment].testEnvironment = EXTestEnvironmentLocal;
  }
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
  NSDictionary *manifest = @{
    @"updates": @{
      @"checkAutomatically": @"ON_ERROR_RECOVERY"
    }
  };
  EXAppLoader *appLoader = [[EXAppLoader alloc] initWithManifestUrl:[NSURL URLWithString:@"exp://exp.host/@esamelson/test-fetch-update"]];
  [appLoader _fetchBundleWithManifest:manifest];
  XCTAssert([appLoader.appFetcher isKindOfClass:[EXAppFetcherWithTimeout class]], @"AppLoader should ignore ON_ERROR_RECOVERY in the Expo client");
}

@end
