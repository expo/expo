#import <XCTest/XCTest.h>

@interface EXAppLoaderFailureTest : XCTestCase

- (instancetype)initWithUrl:(NSURL *)urlExpectingToFail expectation:(XCTestExpectation *)expectation;
- (void)requestAndExpectToFail;

@end
