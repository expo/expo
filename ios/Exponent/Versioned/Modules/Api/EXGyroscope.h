#import <CoreMotion/CoreMotion.h>
#import "RCTEventEmitter.h"
#import "RCTBridge.h"

@interface EXGyroscope : RCTEventEmitter

- (instancetype)initWithExperienceId:(NSString *)experienceId;

@end
