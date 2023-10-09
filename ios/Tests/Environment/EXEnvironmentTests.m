#import "EXEnvironment.h"
#import "EXEnvironment+Tests.h"
#import "EXEnvironmentMocks.h"

#import <XCTest/XCTest.h>

@interface EXEnvironmentTests : XCTestCase

@property (nonatomic, weak) EXEnvironment *environment;

@end

@implementation EXEnvironmentTests

- (void)setUp
{
  [super setUp];
  
  _environment = [EXEnvironment sharedEnvironment];
  if (_environment.testEnvironment == EXTestEnvironmentNone) {
    _environment.testEnvironment = EXTestEnvironmentLocal;
  }
}

- (void)testIsAllManifestUrlsPropertyCorrect
{
  [EXEnvironmentMocks loadProdServiceConfig];
  NSString *expectedProdUrl = [EXEnvironmentMocks shellConfig][@"manifestUrl"];
  XCTAssert(_environment.allManifestUrls.count == 1, @"Service standalone app should only have one manifest url");
  XCTAssert([_environment.allManifestUrls.firstObject isEqualToString:expectedProdUrl], @"Service standalone app's `allManifestUrls` should contain the prod manifest url");
  
  [EXEnvironmentMocks loadDevDetachConfig];
  NSString *expectedDevUrl = [EXEnvironmentMocks expoKitDevUrl];
  XCTAssert(_environment.allManifestUrls.count == 2, @"Dev detached app should have one local, and one prod, manifest url");
  XCTAssert([_environment.allManifestUrls containsObject:expectedProdUrl], @"Dev detached app's `allManifestUrls` should contain the prod manifest url");
  XCTAssert([_environment.allManifestUrls containsObject:expectedDevUrl], @"Dev detached app's `allManifestUrls` should contain the dev manifest url");
}

- (void)testDoesDefaultConfigRespectXcodeScheme
{
  [_environment _loadDefaultConfig];
#if DEBUG
  XCTAssert(_environment.isDebugXCodeScheme, @"Default EXEnvironment config should respect Debug Xcode scheme");
#else
  XCTAssert(!(_environment.isDebugXCodeScheme), @"Default EXEnvironment config should respect Release Xcode scheme");
#endif
}

@end

