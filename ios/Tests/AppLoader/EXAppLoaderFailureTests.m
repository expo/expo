
#import <XCTest/XCTest.h>
#import "EXAppLoaderFailureTest.h"

@interface EXAppLoaderFailureTests : XCTestCase

@end

@implementation EXAppLoaderFailureTests

- (void)testDoesUnsupportedSdkFailToLoad
{
  [self _testDoesUrlFailToLoad:[NSURL URLWithString:@"exp://exp.host/@ben/test-sdk20"]];
}

- (void)testDoesInvalidUrlFailToLoad
{
  [self _testDoesUrlFailToLoad:[NSURL URLWithString:@"exp://abcdef"]];
}

#pragma mark - internal

- (void)_testDoesUrlFailToLoad:(NSURL *)url
{
  XCTestExpectation *expectation = [[XCTestExpectation alloc] initWithDescription:@"AppLoader should fail to load"];
  EXAppLoaderFailureTest *test = [[EXAppLoaderFailureTest alloc] initWithUrl:url expectation:expectation];
  [test requestAndExpectToFail];
  [self waitForExpectations:@[ expectation ] timeout:20.0f];
}

@end
