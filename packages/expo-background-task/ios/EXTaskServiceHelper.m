#import "EXTaskServiceHelper.h"

@implementation EXTaskServiceHelper

+ (nullable id<EXTaskServiceInterface>)sharedTaskService {
  Class taskServiceClass = NSClassFromString(@"EXTaskService");
  if (![taskServiceClass respondsToSelector:@selector(shared)]) {
    return nil;
  }
  id instance = [taskServiceClass performSelector:@selector(shared)];
  if (![instance conformsToProtocol:@protocol(EXTaskServiceInterface)]) {
    return nil;
  }
  return (id<EXTaskServiceInterface>)instance;
}

@end
