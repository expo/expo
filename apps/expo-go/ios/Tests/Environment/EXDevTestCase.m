
#import "EXDevTestCase.h"
#import "EXEnvironmentMocks.h"

@implementation EXDevTestCase

- (void)setUp
{
  [super setUp];
  [EXEnvironmentMocks loadDevConfig];
}

@end
