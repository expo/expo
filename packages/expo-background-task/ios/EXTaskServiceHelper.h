#import <ExpoModulesCore/EXTaskServiceInterface.h>

@interface EXTaskServiceHelper : NSObject
+ (nullable id<EXTaskServiceInterface>)sharedTaskService;
@end
