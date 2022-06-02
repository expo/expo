// Copyright 2021-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXDevLauncher/EXDevLauncherUpdatesHelper.h>

@interface EXDevLauncherUpdatesHelperTests : XCTestCase

@end

@implementation EXDevLauncherUpdatesHelperTests

- (void)testCreateUpdatesConfiguration_scopeKey
{
  NSString *urlString1 = @"https://exp.host/@test/first-app";
  NSURL *url1 = [NSURL URLWithString:urlString1];
  NSDictionary *configuration1 = [EXDevLauncherUpdatesHelper createUpdatesConfigurationWithURL:url1 projectURL:url1 installationID:@"test-installation-id"];

  NSString *urlString2 = @"https://exp.host/@test/second-app";
  NSURL *url2 = [NSURL URLWithString:urlString2];
  NSDictionary *configuration2 = [EXDevLauncherUpdatesHelper createUpdatesConfigurationWithURL:url2 projectURL:url2 installationID:@"test-installation-id"];

  NSString *scopeKey1 = configuration1[@"EXUpdatesScopeKey"];
  NSString *scopeKey2 = configuration2[@"EXUpdatesScopeKey"];
  XCTAssertNotEqualObjects(scopeKey1, scopeKey2);
  XCTAssertEqualObjects(urlString1, scopeKey1);
  XCTAssertEqualObjects(urlString2, scopeKey2);
}

- (void)testCreateUpdatesConfiguration_differentProjectURL
{
  NSString *urlString = @"https://u.expo.dev/update/421ba616-9145-4236-8fe8-7be9f2782a30";
  NSString *projectURLString = @"https://u.expo.dev/2f662161-8616-4f16-9f88-911dfb2d3cd6?channel-name=production";
  NSDictionary *configuration = [EXDevLauncherUpdatesHelper createUpdatesConfigurationWithURL:[NSURL URLWithString:urlString] projectURL:[NSURL URLWithString:projectURLString] installationID:@"test"];

  NSString *updatesURL = configuration[@"EXUpdatesURL"];
  NSString *updatesScopeKey = configuration[@"EXUpdatesScopeKey"];

  XCTAssertNotEqualObjects(updatesURL, updatesScopeKey);
  XCTAssertEqualObjects(urlString, updatesURL);
  XCTAssertEqualObjects(projectURLString, updatesScopeKey);
}

- (void)testCreateUpdatesConfiguration_installationID
{
  NSString *installationID = @"test-installation-id";
  NSURL *url = [NSURL URLWithString:@"https://exp.host/@test/test"];
  NSDictionary *configuration = [EXDevLauncherUpdatesHelper createUpdatesConfigurationWithURL:url projectURL:url installationID:installationID];

  NSDictionary *requestHeaders = configuration[@"EXUpdatesRequestHeaders"];
  XCTAssertNotNil(requestHeaders);
  XCTAssertEqualObjects(installationID, requestHeaders[@"Expo-Dev-Client-ID"]);
}

@end
