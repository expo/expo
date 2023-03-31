// Copyright 2021-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>
#import <OHHTTPStubs/HTTPStubs.h>

#import <EXDevLauncher/EXDevLauncherManifestParser.h>

@import EXManifests;

@interface EXDevLauncherManifestParserTests : XCTestCase

@end

@implementation EXDevLauncherManifestParserTests

- (void)setUp
{
  // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown
{
  [HTTPStubs removeAllStubs];
}

- (void)testIsManifestURLNoHeaders
{
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/200"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:nil];
  }];
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/400"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:400 headers:nil];
  }];
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/500"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:500 headers:nil];
  }];

  [self _testIsManifestURLString:@"http://ohhttpstubs/200" expected:NO description:@"should assume a successful (200) response with no headers means not a manifest URL"];
  [self _testIsManifestURLString:@"http://ohhttpstubs/400" expected:YES description:@"should assume a failed (400) response indicates a manifest URL"];
  [self _testIsManifestURLString:@"http://ohhttpstubs/500" expected:YES description:@"should assume a failed (500) response indicates a manifest URL"];
}

- (void)testIsManifestURLContentType
{
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/json1"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:@{@"Content-Type": @"application/json"}];
  }];
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/json2"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:@{@"Content-Type": @"application/json; charset=UTF-8"}];
  }];
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/multipart"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:@{@"Content-Type": @"multipart/mixed"}];
  }];
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/plaintext"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:@{@"Content-Type": @"text/plain; charset=utf-8"}];
  }];
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/js1"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:@{@"Content-Type": @"application/javascript"}];
  }];
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/js2"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:@{@"Content-Type": @"text/javascript"}];
  }];
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/html"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:@{@"Content-Type": @"text/html"}];
  }];

  [self _testIsManifestURLString:@"http://ohhttpstubs/json1" expected:YES description:@"should assume a JSON content-type indicates a manifest URL"];
  [self _testIsManifestURLString:@"http://ohhttpstubs/json2" expected:YES description:@"should assume a JSON content-type indicates a manifest URL"];
  [self _testIsManifestURLString:@"http://ohhttpstubs/multipart" expected:YES description:@"should assume a multipart content-type indicates a manifest URL"];
  [self _testIsManifestURLString:@"http://ohhttpstubs/plaintext" expected:YES description:@"should assume a plaintext content-type indicates a (multipart) manifest URL"];
  [self _testIsManifestURLString:@"http://ohhttpstubs/js1" expected:NO description:@"should assume a javascript content-type indicates a bundler server"];
  [self _testIsManifestURLString:@"http://ohhttpstubs/js2" expected:NO description:@"should assume a javascript content-type indicates a bundler server"];

  // content-type of response from http://localhost:8081 (no path) after running `react-native start`
  [self _testIsManifestURLString:@"http://ohhttpstubs/html" expected:NO description:@"should assume an HTML content-type indicates a bundler server"];
}

- (void)testIsManifestURLExpoDevServer
{
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/no-expo-server"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:nil];
  }];
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/expo-server"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:@{@"Exponent-Server": @"exponent server"}];
  }];

  [self _testIsManifestURLString:@"http://ohhttpstubs/no-expo-server" expected:NO description:@"should assume a response with no exponent-server header means not a manifest URL"];
  [self _testIsManifestURLString:@"http://ohhttpstubs/expo-server" expected:YES description:@"should detect exponent-server header from expo dev server"];
}

- (void)_testIsManifestURLString:(NSString *)urlString expected:(BOOL)expectedIsManifestUrl description:(NSString *)description
{
  NSURL *url = [NSURL URLWithString:urlString];
  EXDevLauncherManifestParser *parser = [[EXDevLauncherManifestParser alloc] initWithURL:url installationID:nil session:NSURLSession.sharedSession];

  XCTestExpectation *expectation = [self expectationWithDescription:description];

  [parser isManifestURLWithCompletion:^(BOOL isManifestURL) {
    XCTAssertEqual(expectedIsManifestUrl, isManifestURL);
    [expectation fulfill];
  } onError:^(NSError * _Nonnull error) {
    XCTFail(@"Response should have been successful");
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:5 handler:nil];
}

- (void)testIsManifestURL_RequestIncludesPlatformHeader
{
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/platform"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    XCTAssertEqualObjects(@"ios", request.allHTTPHeaderFields[@"expo-platform"]);
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:nil];
  }];

  EXDevLauncherManifestParser *parser = [[EXDevLauncherManifestParser alloc] initWithURL:[NSURL URLWithString:@"http://ohhttpstubs/platform"] installationID:nil session:NSURLSession.sharedSession];

  XCTestExpectation *expectation = [self expectationWithDescription:@"request should include expo-platform header"];

  [parser isManifestURLWithCompletion:^(BOOL isManifestURL) {
    [expectation fulfill];
  } onError:^(NSError * _Nonnull error) {
    XCTFail(@"Response should have been successful");
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:5 handler:nil];
}

- (void)testIsManifestURL_RequestIncludesInstallationID
{
  NSString *installationID = @"test-installation-id";

  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"] && [request.URL.path isEqualToString:@"/installation-id"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    XCTAssertEqualObjects(installationID, request.allHTTPHeaderFields[@"Expo-Dev-Client-ID"]);
    return [HTTPStubsResponse responseWithData:[NSData new] statusCode:200 headers:nil];
  }];

  EXDevLauncherManifestParser *parser = [[EXDevLauncherManifestParser alloc] initWithURL:[NSURL URLWithString:@"http://ohhttpstubs/installation-id"] installationID:installationID session:NSURLSession.sharedSession];

  XCTestExpectation *expectation = [self expectationWithDescription:@"request should include expo-dev-client-id header"];

  [parser isManifestURLWithCompletion:^(BOOL isManifestURL) {
    [expectation fulfill];
  } onError:^(NSError * _Nonnull error) {
    XCTFail(@"Response should have been successful");
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:5 handler:nil];
}

- (void)testParseManifest
{
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    NSString *manifestString = @"{\"name\":\"testproject\",\"slug\":\"testproject\",\"version\":\"1.0.0\",\"orientation\":\"portrait\",\"userInterfaceStyle\":\"light\",\"backgroundColor\":\"#c0ff33\",\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"http://test.io/bundle.js\"}";
    NSData *jsonData = [manifestString dataUsingEncoding:NSUTF8StringEncoding];
    return [HTTPStubsResponse responseWithData:jsonData statusCode:200 headers:nil];
  }];

  NSURL *url = [NSURL URLWithString:@"http://ohhttpstubs"];
  EXDevLauncherManifestParser *parser = [[EXDevLauncherManifestParser alloc] initWithURL:url installationID:nil session:NSURLSession.sharedSession];

  XCTestExpectation *expectation = [self expectationWithDescription:@"should parse manifest successfully"];

  [parser tryToParseManifest:^(EXManifestsManifest * _Nonnull manifest) {
    XCTAssertEqualObjects(@"testproject", manifest.name);
    XCTAssertEqualObjects(@"testproject", manifest.slug);
    XCTAssertEqualObjects(@"1.0.0", manifest.version);
    XCTAssertEqualObjects(@"portrait", manifest.orientation);
    XCTAssertEqualObjects(@"light", manifest.userInterfaceStyle);
    XCTAssertEqualObjects(@"#c0ff33", manifest.iosOrRootBackgroundColor);
    XCTAssertEqualObjects(@"http://test.io/bundle.js", manifest.bundleUrl);
    XCTAssertFalse(manifest.isUsingDeveloperTool);
    [expectation fulfill];
  } onError:^(NSError * _Nonnull error) {
    XCTFail(@"Response should have been successful");
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:5 handler:nil];
}

- (void)testParseManifest_PlatformSpecificValues
{
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    NSString *manifestString = @"{\"name\":\"testproject\",\"slug\":\"testproject\",\"version\":\"1.0.0\",\"orientation\":\"portrait\",\"userInterfaceStyle\":\"light\",\"backgroundColor\":\"#c0ff33\",\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"http://test.io/bundle.js\",\"ios\":{\"userInterfaceStyle\":\"dark\",\"backgroundColor\":\"#e41c00\"}}";
    NSData *jsonData = [manifestString dataUsingEncoding:NSUTF8StringEncoding];
    return [HTTPStubsResponse responseWithData:jsonData statusCode:200 headers:nil];
  }];

  NSURL *url = [NSURL URLWithString:@"http://ohhttpstubs"];
  EXDevLauncherManifestParser *parser = [[EXDevLauncherManifestParser alloc] initWithURL:url installationID:nil session:NSURLSession.sharedSession];

  XCTestExpectation *expectation = [self expectationWithDescription:@"should parse manifest successfully"];

  [parser tryToParseManifest:^(EXManifestsManifest * _Nonnull manifest) {
    XCTAssertEqualObjects(@"dark", manifest.userInterfaceStyle);
    XCTAssertEqualObjects(@"#e41c00", manifest.iosOrRootBackgroundColor);
    [expectation fulfill];
  } onError:^(NSError * _Nonnull error) {
    XCTFail(@"Response should have been successful");
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:5 handler:nil];
}

- (void)testParseManifest_DeveloperTool
{
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    NSString *manifestString = @"{\"name\":\"testproject\",\"slug\":\"testproject\",\"version\":\"1.0.0\",\"orientation\":\"portrait\",\"userInterfaceStyle\": \"light\",\"backgroundColor\": \"#c0ff33\",\"sdkVersion\":\"42.0.0\",\"bundleUrl\":\"http://test.io/bundle.js\",\"developer\":{\"tool\":\"expo-cli\"}}";
    NSData *jsonData = [manifestString dataUsingEncoding:NSUTF8StringEncoding];
    return [HTTPStubsResponse responseWithData:jsonData statusCode:200 headers:nil];
  }];

  NSURL *url = [NSURL URLWithString:@"http://ohhttpstubs"];
  EXDevLauncherManifestParser *parser = [[EXDevLauncherManifestParser alloc] initWithURL:url installationID:nil session:NSURLSession.sharedSession];

  XCTestExpectation *expectation = [self expectationWithDescription:@"should parse manifest successfully"];

  [parser tryToParseManifest:^(EXManifestsManifest * _Nonnull manifest) {
    XCTAssertTrue(manifest.isUsingDeveloperTool);
    [expectation fulfill];
  } onError:^(NSError * _Nonnull error) {
    XCTFail(@"Response should have been successful");
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:5 handler:nil];
}

- (void)testParseManifest_InvalidJson
{
  [HTTPStubs stubRequestsPassingTest:^BOOL(NSURLRequest * _Nonnull request) {
    return [request.URL.host isEqualToString:@"ohhttpstubs"];
  } withStubResponse:^HTTPStubsResponse * _Nonnull(NSURLRequest * _Nonnull request) {
    NSString *manifestString = @"{invalid json}";
    NSData *jsonData = [manifestString dataUsingEncoding:NSUTF8StringEncoding];
    return [HTTPStubsResponse responseWithData:jsonData statusCode:200 headers:nil];
  }];

  NSURL *url = [NSURL URLWithString:@"http://ohhttpstubs"];
  EXDevLauncherManifestParser *parser = [[EXDevLauncherManifestParser alloc] initWithURL:url installationID:nil session:NSURLSession.sharedSession];

  XCTestExpectation *expectation = [self expectationWithDescription:@"should fail to parse manifest"];

  [parser tryToParseManifest:^(EXManifestsManifest * _Nonnull manifest) {
    XCTFail(@"Parsing bad JSON should not have been successful");
    [expectation fulfill];
  } onError:^(NSError * _Nonnull error) {
    XCTAssertNotNil(error);
    [expectation fulfill];
  }];

  [self waitForExpectationsWithTimeout:5 handler:nil];
}

@end
