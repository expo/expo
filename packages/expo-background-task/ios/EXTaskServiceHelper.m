#import "EXTaskServiceHelper.h"
#import <ExpoTaskManager/EXTaskService.h>

@implementation EXTaskServiceHelper

+ (nullable id<EXTaskServiceInterface>)sharedTaskService {
  return (id<EXTaskServiceInterface>)EXTaskService.shared;
}

@end
