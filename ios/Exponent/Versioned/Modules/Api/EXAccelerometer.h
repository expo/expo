#import <CoreMotion/CoreMotion.h>
#import "RCTEventEmitter.h"
#import "RCTBridge.h"

@interface EXAccelerometer : RCTEventEmitter

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end
