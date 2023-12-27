
#import "EXClientTestCase.h"
#import "EXEnvironmentMocks.h"

@implementation EXClientTestCase

- (void)setUp
{
  [super setUp];
  [EXEnvironmentMocks loadExpoClientConfig];
}

@end
