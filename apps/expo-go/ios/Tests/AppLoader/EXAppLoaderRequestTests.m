
#import <XCTest/XCTest.h>
#import "EXAppLoader+Tests.h"
#import "EXAppLoaderRequestExpectation.h"

@interface EXAppLoaderRequestTests : XCTestCase

@end

@implementation EXAppLoaderRequestTests

#pragma mark - requests that should succeed

- (void)testDoesNCLLoad
{
  [self _testDoesUrlLoadSuccessfully:[NSURL URLWithString:@"exp://exp.host/@community/native-component-list"]
                         description:@"AppLoader should load something for Native Component List"];
}

#pragma mark - requests that should fail

- (void)testDoesUnsupportedSdkFailToLoad
{
  [self _testDoesUrlFailToLoad:[NSURL URLWithString:@"exp://exp.host/@ben/test-sdk20"]
                   description:@"AppLoader should not load a valid app running an unsupported SDK version"];
}

- (void)testDoesUnsupportedReleaseChannelFailToLoad
{
  [self _testDoesUrlFailToLoad:[NSURL URLWithString:@"exp://exp.host/@ben/test-sdk28?release-channel=fake"]
                   description:@"AppLoader should not load anything from a valid app with a nonexistent release channel"];
}

- (void)testDoesInvalidUrlFailToLoad
{
  [self _testDoesUrlFailToLoad:[NSURL URLWithString:@"exp://abcdef"]
                   description:@"AppLoader should not load anything from a nonexistent app url"];
}

#pragma mark - internal

- (void)_testDoesUrlFailToLoad:(NSURL *)url description:(NSString *)description
{
  XCTestExpectation *expectToSucceed = [[XCTestExpectation alloc] initWithDescription:description];
  [expectToSucceed setInverted:YES]; // this test should fail if the request succeeds in loading an app.
  XCTestExpectation *expectToFail = [[XCTestExpectation alloc] initWithDescription:description];
  EXAppLoaderRequestExpectation *test = [[EXAppLoaderRequestExpectation alloc] initWithUrl:url expectToSucceed:expectToSucceed expectToFail:expectToFail];
  [test request];
  
  // wait for request to fail
  // this will take the full 10 seconds because it also enforces that `expectToSucceed` times out
  [self waitForExpectations:@[ expectToSucceed, expectToFail ] timeout:10.0f];
  
  // perform additional validation on AppLoader
  XCTAssert(test.appLoader.appFetcher != nil, @"App loader should preserve app fetcher state after failure");
}

- (void)_testDoesUrlLoadSuccessfully:(NSURL *)url description:(NSString *)description
{
  XCTestExpectation *expectToSucceed = [[XCTestExpectation alloc] initWithDescription:description];
  XCTestExpectation *expectToFail = [[XCTestExpectation alloc] initWithDescription:description];
  [expectToFail setInverted:YES]; // this test should fail if the request calls its failure handler.
  EXAppLoaderRequestExpectation *test = [[EXAppLoaderRequestExpectation alloc] initWithUrl:url expectToSucceed:expectToSucceed expectToFail:expectToFail];
  [test request];
  
  // wait for request to load
  [self waitForExpectations:@[ expectToSucceed ] timeout:30.0f];
}

@end
