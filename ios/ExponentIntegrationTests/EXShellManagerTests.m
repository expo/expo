#import "EXShellManager.h"
#import "EXShellManager+Tests.h"

#import <XCTest/XCTest.h>

@interface EXShellManagerTests : XCTestCase

@property (nonatomic, strong) NSDictionary *serviceConfig;
@property (nonatomic, strong) NSDictionary *infoPlist;
@property (nonatomic, strong) NSString *prodUrlScheme;
@property (nonatomic, strong) NSString *expoKitDevUrl;
@property (nonatomic, weak) EXShellManager *shellManager;

@end

@implementation EXShellManagerTests

- (void)setUp
{
  [super setUp];
  
  if ([EXShellManager sharedInstance].testEnvironment == EXTestEnvironmentNone) {
    [EXShellManager sharedInstance].testEnvironment = EXTestEnvironmentLocal;
  }
  
  _shellManager = [EXShellManager sharedInstance];
  _serviceConfig = @{
    @"isShell": @YES,
    @"manifestUrl": @"https://exp.host/@community/native-component-list",
  };
  _prodUrlScheme = @"ncl";
  _expoKitDevUrl = [NSString stringWithFormat:@"%@://%@", _prodUrlScheme, @"localhost:19000"];
  _infoPlist = @{
    @"CFBundleURLTypes": @[
      @{
        @"CFBundleURLSchemes": @[
          _prodUrlScheme,
        ],
      },
    ],
  };
}

- (void)testIsServiceConfigRespected
{
  [self _loadProdNCLServiceConfig];
  XCTAssert(_shellManager.isShell, @"Shell manager should indicate isShell == true when a valid shell config is provided");
  XCTAssert([_shellManager.shellManifestUrl isEqualToString:_serviceConfig[@"manifestUrl"]], @"Shell manager should adopt the manifest url specified in the config");
  XCTAssert([_shellManager.releaseChannel isEqualToString:@"default"], @"Shell manager should use default release channel when none is specified");
  XCTAssert([_shellManager.urlScheme isEqualToString:_prodUrlScheme], @"Shell manager should adopt url scheme %@ when configured", _prodUrlScheme);
}

- (void)testIsDevDetachConfigRespected
{
  [self _loadDevDetachConfig];
  XCTAssert(_shellManager.isShell, @"Shell manager should indicate isShell == true when a dev detach config is provided");
  XCTAssert([_shellManager.shellManifestUrl isEqualToString:_expoKitDevUrl], @"Shell manager should adopt the local dev url when a dev detach config is provided");
  XCTAssert([_shellManager.releaseChannel isEqualToString:@"default"], @"Shell manager should use default release channel when a dev detach config is provided");
  XCTAssert([_shellManager.urlScheme isEqualToString:_prodUrlScheme], @"Shell manager should adopt url scheme %@ when configured", _prodUrlScheme);
}

- (void)testDoesMissingDevDetachUrlThrow
{
  // local dev detach with nil dev url
  XCTAssertThrows(
    [_shellManager _loadShellConfig:_serviceConfig
                      withInfoPlist:_infoPlist
                  withExpoKitDevUrl:nil
                         isDetached:YES
                 isDebugXCodeScheme:YES
                       isUserDetach:YES]
                  , @"Configuring shell manager as a local detached project in Debug mode should throw if no development url is provided");
}

- (void)testDoesProdDetachUseProdUrl
{
  [_shellManager _loadShellConfig:_serviceConfig
                    withInfoPlist:_infoPlist
                withExpoKitDevUrl:_expoKitDevUrl
                       isDetached:YES
               isDebugXCodeScheme:NO
                     isUserDetach:YES];
  XCTAssert([_shellManager.shellManifestUrl isEqualToString:_serviceConfig[@"manifestUrl"]], @"Shell manager should ignore the ExpoKit dev url when using a prod build scheme");
}

#pragma mark - internal

/**
 *  Load mock configuration for native component list as production turtle should write it.
 */
- (void)_loadProdNCLServiceConfig
{
  [_shellManager _loadShellConfig:_serviceConfig withInfoPlist:_infoPlist withExpoKitDevUrl:nil isDetached:YES isDebugXCodeScheme:NO isUserDetach:NO];
}

- (void)_loadDevDetachConfig
{
  [_shellManager _loadShellConfig:_serviceConfig
                    withInfoPlist:_infoPlist
                withExpoKitDevUrl:_expoKitDevUrl
                       isDetached:YES
               isDebugXCodeScheme:YES
                     isUserDetach:YES];
}

@end
