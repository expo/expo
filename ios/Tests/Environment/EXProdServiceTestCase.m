
#import "EXProdServiceTestCase.h"
#import "EXEnvironmentMocks.h"

@implementation EXProdServiceTestCase

- (void)setUp
{
  [super setUp];
  [EXEnvironmentMocks loadProdServiceConfig];
}

@end
