/**
 *  Tests deep link transforming/routing methods in the Expo runtime.
 */

#import <XCTest/XCTest.h>
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

#pragma mark - tests

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
