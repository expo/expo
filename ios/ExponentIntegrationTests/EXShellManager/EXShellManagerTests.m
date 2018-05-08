#import "EXShellManager.h"
#import "EXShellManager+Tests.h"
#import "EXShellManagerMocks.h"

#import <XCTest/XCTest.h>

@interface EXShellManagerTests : XCTestCase

@property (nonatomic, weak) EXShellManager *shellManager;

@end

@implementation EXShellManagerTests

- (void)setUp
{
  [super setUp];
  
  _shellManager = [EXShellManager sharedInstance];
  if (_shellManager.testEnvironment == EXTestEnvironmentNone) {
    _shellManager.testEnvironment = EXTestEnvironmentLocal;
  }
}

- (void)testIsServiceConfigRespected
{
  [EXShellManagerMocks loadProdServiceConfig];
  NSDictionary *expectedShellConfig = [EXShellManagerMocks shellConfig];
  NSString *expectedUrlScheme = [EXShellManagerMocks prodUrlScheme];
  XCTAssert(_shellManager.isShell, @"Shell manager should indicate isShell == true when a valid shell config is provided");
  XCTAssert([_shellManager.shellManifestUrl isEqualToString:expectedShellConfig[@"manifestUrl"]], @"Shell manager should adopt the manifest url specified in the config");
  XCTAssert([_shellManager.releaseChannel isEqualToString:@"default"], @"Shell manager should use default release channel when none is specified");
  XCTAssert([_shellManager.urlScheme isEqualToString:expectedUrlScheme], @"Shell manager should adopt url scheme %@ when configured", expectedUrlScheme);
}

- (void)testIsDevDetachConfigRespected
{
  [EXShellManagerMocks loadDevDetachConfig];
  NSString *expectedUrl = [EXShellManagerMocks expoKitDevUrl];
  NSString *expectedUrlScheme = [EXShellManagerMocks prodUrlScheme];
  XCTAssert(_shellManager.isShell, @"Shell manager should indicate isShell == true when a dev detach config is provided");
  XCTAssert([_shellManager.shellManifestUrl isEqualToString:expectedUrl], @"Shell manager should adopt the local dev url when a dev detach config is provided");
  XCTAssert([_shellManager.releaseChannel isEqualToString:@"default"], @"Shell manager should use default release channel when a dev detach config is provided");
  XCTAssert([_shellManager.urlScheme isEqualToString:expectedUrlScheme], @"Shell manager should adopt url scheme %@ when configured", expectedUrlScheme);
}

- (void)testDoesMissingDevDetachUrlThrow
{
  // local dev detach with nil dev url
  XCTAssertThrows(
    [_shellManager _loadShellConfig:[EXShellManagerMocks shellConfig]
                      withInfoPlist:[EXShellManagerMocks infoPlist]
                  withExpoKitDevUrl:nil
                         isDetached:YES
                 isDebugXCodeScheme:YES
                       isUserDetach:YES]
                  , @"Configuring shell manager as a local detached project in Debug mode should throw if no development url is provided");
}

- (void)testDoesProdDetachUseProdUrl
{
  NSDictionary *expectedShellConfig = [EXShellManagerMocks shellConfig];
  [_shellManager _loadShellConfig:expectedShellConfig
                    withInfoPlist:[EXShellManagerMocks infoPlist]
                withExpoKitDevUrl:[EXShellManagerMocks expoKitDevUrl]
                       isDetached:YES
               isDebugXCodeScheme:NO
                     isUserDetach:YES];
  XCTAssert([_shellManager.shellManifestUrl isEqualToString:expectedShellConfig[@"manifestUrl"]], @"Shell manager should ignore the ExpoKit dev url when using a prod build scheme");
}

@end
