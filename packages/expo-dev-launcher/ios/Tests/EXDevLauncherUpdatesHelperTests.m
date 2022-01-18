// Copyright 2021-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>

#import <EXDevLauncher/EXDevLauncherUpdatesHelper.h>

@interface EXDevLauncherUpdatesHelperTests : XCTestCase

@end

@implementation EXDevLauncherUpdatesHelperTests

- (void)testCreateUpdatesConfiguration_scopeKey
{
  NSString *urlString1 = @"https://exp.host/@test/first-app";
  NSDictionary *configuration1 = [EXDevLauncherUpdatesHelper createUpdatesConfigurationWithURL:[NSURL URLWithString:urlString1] installationID:@"test-installation-id"];

  NSString *urlString2 = @"https://exp.host/@test/second-app";
  NSDictionary *configuration2 = [EXDevLauncherUpdatesHelper createUpdatesConfigurationWithURL:[NSURL URLWithString:urlString2] installationID:@"test-installation-id"];

  NSString *scopeKey1 = configuration1[@"EXUpdatesScopeKey"];
  NSString *scopeKey2 = configuration2[@"EXUpdatesScopeKey"];
  XCTAssertNotEqualObjects(scopeKey1, scopeKey2);
  XCTAssertEqualObjects(urlString1, scopeKey1);
  XCTAssertEqualObjects(urlString2, scopeKey2);
}

- (void)testCreateUpdatesConfiguration_installationID
{
  NSString *installationID = @"test-installation-id";
  NSDictionary *configuration = [EXDevLauncherUpdatesHelper createUpdatesConfigurationWithURL:[NSURL URLWithString:@"https://exp.host/@test/test"] installationID:installationID];

  NSDictionary *requestHeaders = configuration[@"EXUpdatesRequestHeaders"];
  XCTAssertNotNil(requestHeaders);
  XCTAssertEqualObjects(installationID, requestHeaders[@"Expo-Dev-Client-ID"]);
}

@end
