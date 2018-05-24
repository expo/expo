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
  [EXShellManagerMocks loadProdServiceConfig];
  NSDictionary *expectedShellConfig = [EXShellManagerMocks shellConfig];
  NSString *expectedUrlScheme = [EXShellManagerMocks prodUrlScheme];
  NSDictionary *expectedEmbeddedManifest = [EXShellManagerMocks embeddedManifest];
  XCTAssert(_environment.isDetached, @"Shell manager should indicate isDetached == true when a valid standalone config is provided");
  XCTAssert([_environment.standaloneManifestUrl isEqualToString:expectedShellConfig[@"manifestUrl"]], @"Shell manager should adopt the manifest url specified in the config");
  XCTAssert([_environment.releaseChannel isEqualToString:@"default"], @"Shell manager should use default release channel when none is specified");
  XCTAssert([_environment.urlScheme isEqualToString:expectedUrlScheme], @"Shell manager should adopt url scheme %@ when configured", expectedUrlScheme);
  XCTAssert([_environment.embeddedBundleUrl isEqualToString:expectedEmbeddedManifest[@"bundleUrl"]], @"Shell manager should adopt the bundle url specified in the embedded manifest");
}

- (void)testIsDevDetachConfigRespected
{
  [EXShellManagerMocks loadDevDetachConfig];
  NSString *expectedUrl = [EXShellManagerMocks expoKitDevUrl];
  NSString *expectedUrlScheme = [EXShellManagerMocks prodUrlScheme];
  NSDictionary *expectedEmbeddedManifest = [EXShellManagerMocks embeddedManifest];
  XCTAssert(_environment.isDetached, @"Shell manager should indicate isDetached == true when a dev detach config is provided");
  XCTAssert([_environment.standaloneManifestUrl isEqualToString:expectedUrl], @"Shell manager should adopt the local dev url when a dev detach config is provided");
  XCTAssert([_environment.releaseChannel isEqualToString:@"default"], @"Shell manager should use default release channel when a dev detach config is provided");
  XCTAssert([_environment.urlScheme isEqualToString:expectedUrlScheme], @"Shell manager should adopt url scheme %@ when configured", expectedUrlScheme);
  XCTAssert([_environment.embeddedBundleUrl isEqualToString:expectedEmbeddedManifest[@"bundleUrl"]], @"Shell manager should adopt the bundle url specified in the embedded manifest");
}

- (void)testDoesMissingDevDetachUrlThrow
{
  // local dev detach with nil dev url
  XCTAssertThrows(
                  [_environment _loadShellConfig:[EXShellManagerMocks shellConfig]
                                   withInfoPlist:[EXShellManagerMocks infoPlist]
                               withExpoKitDevUrl:nil
                            withEmbeddedManifest:[EXShellManagerMocks embeddedManifest]
                                      isDetached:YES
                              isDebugXCodeScheme:YES
                                    isUserDetach:YES]
                  , @"Configuring shell manager as a local detached project in Debug mode should throw if no development url is provided");
}

- (void)testDoesProdDetachUseProdUrl
{
  NSDictionary *expectedShellConfig = [EXShellManagerMocks shellConfig];
  [_environment _loadShellConfig:expectedShellConfig
                   withInfoPlist:[EXShellManagerMocks infoPlist]
               withExpoKitDevUrl:[EXShellManagerMocks expoKitDevUrl]
            withEmbeddedManifest:[EXShellManagerMocks embeddedManifest]
                      isDetached:YES
              isDebugXCodeScheme:NO
                    isUserDetach:YES];
  XCTAssert([_environment.standaloneManifestUrl isEqualToString:expectedShellConfig[@"manifestUrl"]], @"Shell manager should ignore the ExpoKit dev url when using a prod build scheme");
}

@end

