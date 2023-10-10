#import "EXEnvironment.h"
#import "EXEnvironment+Tests.h"
#import "EXEnvironmentMocks.h"

#import <XCTest/XCTest.h>

@interface EXEnvironmentTests : XCTestCase

@property (nonatomic, weak) EXEnvironment *environment;

@end

@implementation EXEnvironmentTests

- (void)setUp
{
  [super setUp];

  _environment = [EXEnvironment sharedEnvironment];
  if (_environment.testEnvironment == EXTestEnvironmentNone) {
    _environment.testEnvironment = EXTestEnvironmentLocal;
  }
}

- (void)testDoesDefaultConfigRespectXcodeScheme
{
  [_environment _loadDefaultConfig];
#if DEBUG
  XCTAssert(_environment.isDebugXCodeScheme, @"Default EXEnvironment config should respect Debug Xcode scheme");
#else
  XCTAssert(!(_environment.isDebugXCodeScheme), @"Default EXEnvironment config should respect Release Xcode scheme");
#endif
}

@end

