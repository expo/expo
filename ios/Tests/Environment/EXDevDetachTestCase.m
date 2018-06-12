
#import "EXDevDetachTestCase.h"
#import "EXEnvironmentMocks.h"

@implementation EXDevDetachTestCase

- (void)setUp
{
  [super setUp];
  [EXEnvironmentMocks loadDevDetachConfig];
}

@end
