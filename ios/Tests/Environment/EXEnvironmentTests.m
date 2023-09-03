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

- (void)testIsServiceConfigRespected
{
  [EXEnvironmentMocks loadProdServiceConfig];
  NSDictionary *expectedShellConfig = [EXEnvironmentMocks shellConfig];
  NSString *expectedUrlScheme = [EXEnvironmentMocks prodUrlScheme];
  NSDictionary *expectedEmbeddedManifest = [EXEnvironmentMocks embeddedManifest];
  XCTAssert([_environment.urlScheme isEqualToString:expectedUrlScheme], @"EXEnvironment should adopt url scheme %@ when configured", expectedUrlScheme);
  XCTAssert([_environment.embeddedBundleUrl isEqualToString:expectedEmbeddedManifest[@"bundleUrl"]], @"EXEnvironment should adopt the bundle url specified in the embedded manifest");
}

- (void)testIsDevDetachConfigRespected
{
  [EXEnvironmentMocks loadDevDetachConfig];
  NSString *expectedUrl = [EXEnvironmentMocks expoKitDevUrl];
  NSString *expectedUrlScheme = [EXEnvironmentMocks prodUrlScheme];
  NSDictionary *expectedEmbeddedManifest = [EXEnvironmentMocks embeddedManifest];
  XCTAssert([_environment.urlScheme isEqualToString:expectedUrlScheme], @"EXEnvironment should adopt url scheme %@ when configured", expectedUrlScheme);
  XCTAssert([_environment.embeddedBundleUrl isEqualToString:expectedEmbeddedManifest[@"bundleUrl"]], @"EXEnvironment should adopt the bundle url specified in the embedded manifest");
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

- (void)testDoesMissingDevDetachUrlThrow
{
  // local dev detach with nil dev url
  XCTAssertThrows(
                  [_environment _loadShellConfig:[EXEnvironmentMocks shellConfig]
                                   withInfoPlist:[EXEnvironmentMocks infoPlist]
                               withExpoKitDevUrl:nil
                            withEmbeddedManifest:[EXEnvironmentMocks embeddedManifest]
                                      isDetached:YES
                              isDebugXCodeScheme:YES
                                    isUserDetach:YES]
                  , @"Configuring EXEnvironment as a local detached project in Debug mode should throw if no development url is provided");
}

- (void)testDoesProdDetachUseProdUrl
{
  NSDictionary *expectedShellConfig = [EXEnvironmentMocks shellConfig];
  [_environment _loadShellConfig:expectedShellConfig
                   withInfoPlist:[EXEnvironmentMocks infoPlist]
               withExpoKitDevUrl:[EXEnvironmentMocks expoKitDevUrl]
            withEmbeddedManifest:[EXEnvironmentMocks embeddedManifest]
                      isDetached:YES
              isDebugXCodeScheme:NO
                    isUserDetach:YES];
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

