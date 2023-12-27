// this class builds an AppLoader, starts a request,
// then waits for the AppLoader to succeed or fail
// and reports the result to the corresponding XCTestExpectation.

#import <XCTest/XCTest.h>

@interface EXAppLoaderRequestExpectation : NSObject

- (instancetype)initWithUrl:(NSURL *)urlToRequest
            expectToSucceed:(XCTestExpectation *)expectToSucceed
               expectToFail:(XCTestExpectation *)expectToFail;
- (void)request;

@property (nonatomic, readonly) EXDevelopmentHomeLoader *appLoader;

@end
