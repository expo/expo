#import "EXShellManager.h"
#import "EXShellManager+Tests.h"

#import <XCTest/XCTest.h>

@interface EXShellManagerTests : XCTestCase

@property (nonatomic, strong) NSDictionary *serviceConfig;
@property (nonatomic, strong) NSDictionary *infoPlist;
@property (nonatomic, strong) NSString *prodUrlScheme;
@property (nonatomic, weak) EXShellManager *shellManager;

@end

@implementation EXShellManagerTests

- (void)setUp
{
  [super setUp];
  
  _shellManager = [EXShellManager sharedInstance];
  _serviceConfig = @{
    @"isShell": @YES,
    @"manifestUrl": @"https://exp.host/@community/native-component-list",
  };
  _prodUrlScheme = @"ncl://";
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
}

#pragma mark - internal

/**
 *  Load mock configuration for native component list as production turtle should write it.
 */
- (void)_loadProdNCLServiceConfig
{
  [_shellManager _loadShellConfig:_serviceConfig withInfoPlist:_infoPlist withExpoKitDevUrl:nil isDetached:YES isDebugXCodeScheme:NO isUserDetach:NO];
}

@end
