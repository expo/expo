// Copyright 2021-present 650 Industries. All rights reserved.

#import <XCTest/XCTest.h>
#import <OHHTTPStubs/HTTPStubs.h>

#import <EXDevLauncher/EXDevLauncherManifestParser.h>

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
  EXDevLauncherManifestParser *parser = [[EXDevLauncherManifestParser alloc] initWithURL:url session:NSURLSession.sharedSession];
  
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

@end
