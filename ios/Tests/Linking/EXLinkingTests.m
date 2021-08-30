/**
 *  Tests deep link transforming/routing methods in the Expo runtime.
 */

#import <XCTest/XCTest.h>
#import "EXKernel.h"
#import "EXKernelLinkingManager.h"

#pragma mark - private/internal methods in Linking Manager

@interface EXKernelLinkingManager (EXLinkingTests)

+ (BOOL)_isUrl:(NSURL *)urlToRoute deepLinkIntoAppWithManifestUrl:(NSURL *)manifestUrl;

@end

@interface EXLinkingTests : XCTestCase

@end

@implementation EXLinkingTests

- (void)setUp
{
  [super setUp];
}

#pragma mark - test link routing

- (void)testIsClientDeepLinkRoutedCorrectly
{
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin" routesToManifest:@"https://exp.host/@ben/foodwheel"];
}

- (void)testIsDeepLinkingInvariantToExpoSchemes
{
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin" routesToManifest:@"exp://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"http://exp.host/@ben/foodwheel/--/spin" routesToManifest:@"exp://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"exp://exp.host/@ben/foodwheel/--/spin" routesToManifest:@"https://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"exps://exp.host/@ben/foodwheel/--/spin" routesToManifest:@"https://exp.host/@ben/foodwheel"];
}

- (void)testIsDeepLinkingInvariantToReleaseChannelDefault
{
  // deep link contains release channel default, manifest does not specify
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin?release-channel=default" routesToManifest:@"exp://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel?release-channel=default" routesToManifest:@"exp://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/?release-channel=default" routesToManifest:@"exp://exp.host/@ben/foodwheel"];
  
  // deep link does not specify a release channel, manifest specifies default
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel" routesToManifest:@"exp://exp.host/@ben/foodwheel?release-channel=default"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin" routesToManifest:@"exp://exp.host/@ben/foodwheel?release-channel=default"];
  
  // deep link and manifest both specify default release channel
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin?release-channel=default" routesToManifest:@"exp://exp.host/@ben/foodwheel?release-channel=default"];
}

- (void)testDoesDeepLinkingRespectCustomReleaseChannel
{
  // deep link specifies custom release channel, manifest does not specify, or uses default
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel?release-channel=banana" doesNotRouteToManifest:@"https://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin?release-channel=banana" doesNotRouteToManifest:@"https://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel?release-channel=banana" doesNotRouteToManifest:@"https://exp.host/@ben/foodwheel?release-channel=default"];
  
  // deep link does not specify a release channel, or uses default; manifest specifies custom
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel" doesNotRouteToManifest:@"https://exp.host/@ben/foodwheel?release-channel=banana"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin" doesNotRouteToManifest:@"https://exp.host/@ben/foodwheel?release-channel=banana"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin?release-channel=default" doesNotRouteToManifest:@"https://exp.host/@ben/foodwheel?release-channel=banana"];
}

- (void)testDoesDeepLinkingDifferentiateDomains
{
  [self _assertDeepLink:@"https://expo.io/@ben/foodwheel" doesNotRouteToManifest:@"https://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"https://google.com/@ben/foodwheel" doesNotRouteToManifest:@"https://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"https://@ben/foodwheel" doesNotRouteToManifest:@"https://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"https://expo.io/@ben/foodwheel" doesNotRouteToManifest:@"https://@ben/foodwheel"];
}

- (void)testIsDeepLinkingInvariantToQueryString
{
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel?a=b&c=d" routesToManifest:@"exp://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel?a=b&c=d" routesToManifest:@"exp://exp.host/@ben/foodwheel?release-channel=default"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel?a=b&c=d&release-channel=default" routesToManifest:@"exp://exp.host/@ben/foodwheel?release-channel=default"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin?a=b&c=d" routesToManifest:@"exp://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin?a=b&c=d" routesToManifest:@"exp://exp.host/@ben/foodwheel?release-channel=default"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin?a=b&c=d&release-channel=default" routesToManifest:@"exp://exp.host/@ben/foodwheel?release-channel=default"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/spin?a=b&c=d&release-channel=banana" doesNotRouteToManifest:@"exp://exp.host/@ben/foodwheel"];
}

- (void)testIsDeepLinkingInvariantToDeepLinkPath
{
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel/--/a/b/c" routesToManifest:@"exp://exp.host/@ben/foodwheel"];
  [self _assertDeepLink:@"https://exp.host/@ben/foodwheel" routesToManifest:@"exp://exp.host/@ben/foodwheel/--/a/b/c"];
}

- (void)testArePhoneLinksNotDeepLinks
{
  // tel and sms links should never be deep links
  NSURL *smsUrl = [NSURL URLWithString:@"sms:+604-288-8555"];
  NSURL *telUrl = [NSURL URLWithString:@"tel:1-408-555-5555"];
  for (NSURL *url in @[ smsUrl, telUrl ]) {
    XCTAssert([[EXKernel sharedInstance].serviceRegistry.linkingManager linkingModule:nil shouldOpenExpoUrl:url] == NO,
              @"URL %@ should not be routed internally as a deep link", url);
  }
}

- (void)testAreExpoSubdomainsNotDeepLinks
{
  NSURL *docsUrl = [NSURL URLWithString:@"https://docs.expo.io"];
  XCTAssert([[EXKernel sharedInstance].serviceRegistry.linkingManager linkingModule:nil shouldOpenExpoUrl:docsUrl] == NO,
            @"URL %@ should not be routed internally as a deep link", docsUrl);
}

#pragma mark - test url parsing/transforms

- (void)testIsDeepLinkRemoved
{
  NSString *manifestWithNoDeepLink = @"https://exp.host/@ben/foodwheel/";
  NSArray<NSString *> *deepLinks = @[
    @"https://exp.host/@ben/foodwheel/--/",
    @"https://exp.host/@ben/foodwheel/--/spin",
    @"https://exp.host/@ben/foodwheel/--/a/b/c",
    @"https://exp.host/@ben/foodwheel/--/spin?a=b&c=d",
    // @"https://exp.host/@ben/foodwheel?a=b&c=d", // TODO: should this case be supported?
  ];
  for (NSString *deepLink in deepLinks) {
    NSString *result = [EXKernelLinkingManager stringByRemovingDeepLink:deepLink];
    XCTAssert([result isEqualToString:manifestWithNoDeepLink],
              @"Linking manager should correctly remove the deep link from %@, but instead it returned %@", deepLink, result);
  }
}

#pragma mark - EAS manifests

- (void)testEASManifestUrls {
  [self _assertDeepLink:@"exps://updates.expo.dev/37700852-0840-47b7-80cb-d57746395f57?runtime-version=exposdk%3A40.0.0&channel-name=main" routesToManifest:@"exps://updates.expo.dev/37700852-0840-47b7-80cb-d57746395f57?runtime-version=exposdk%3A40.0.0&channel-name=main"];
}

#pragma mark - internal

- (void)_assertDeepLink:(NSString *)deepLinkUrlString routesToManifest:(NSString *)manifestUrlString
{
  NSURL *deepLinkUrl = [NSURL URLWithString:deepLinkUrlString];
  NSURL *manifestUrl = [NSURL URLWithString:manifestUrlString];
  BOOL result = [EXKernelLinkingManager _isUrl:deepLinkUrl deepLinkIntoAppWithManifestUrl:manifestUrl];
  XCTAssert(result, @"Url %@ should deep link to manifest url %@", deepLinkUrl, manifestUrl);
}

- (void)_assertDeepLink:(NSString *)deepLinkUrlString doesNotRouteToManifest:(NSString *)manifestUrlString
{
  NSURL *deepLinkUrl = [NSURL URLWithString:deepLinkUrlString];
  NSURL *manifestUrl = [NSURL URLWithString:manifestUrlString];
  BOOL result = [EXKernelLinkingManager _isUrl:deepLinkUrl deepLinkIntoAppWithManifestUrl:manifestUrl];
  XCTAssert(!result, @"Url %@ should NOT deep link to manifest url %@", deepLinkUrl, manifestUrl);
}

@end
