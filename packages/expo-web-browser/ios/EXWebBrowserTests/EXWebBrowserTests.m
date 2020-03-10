#import <XCTest/XCTest.h>
#import "EXWebBrowser.h"

@interface EXWebBrowserTests : XCTestCase

@end

@implementation EXWebBrowserTests

#pragma mark - emptyTest

- (void)testEmpty
{
  EXWebBrowser *webBrowser = [EXWebBrowser new];
  XCTAssert(webBrowser != nil);
}

@end
