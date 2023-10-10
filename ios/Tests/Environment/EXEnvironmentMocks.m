#import "EXEnvironment.h"
#import "EXEnvironment+Tests.h"
#import "EXEnvironmentMocks.h"

@implementation EXEnvironmentMocks

#pragma mark - mock environment presets

+ (void)loadExpoClientConfig
{
  [[EXEnvironment sharedEnvironment] _resetAndLoadIsDebugXCodeScheme:NO];
}

+ (void)loadDevConfig
{
  [[EXEnvironment sharedEnvironment] _resetAndLoadIsDebugXCodeScheme:YES];
}

 @end
