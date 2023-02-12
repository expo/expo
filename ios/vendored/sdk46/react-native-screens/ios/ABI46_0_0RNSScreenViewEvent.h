#import <ABI46_0_0React/ABI46_0_0RCTBridge+Private.h>
#import <ABI46_0_0React/ABI46_0_0RCTEventDispatcherProtocol.h>

@interface ABI46_0_0RNSScreenViewEvent : NSObject <ABI46_0_0RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName
                         ABI46_0_0ReactTag:(NSNumber *)ABI46_0_0ReactTag
                         progress:(double)progress
                          closing:(int)closing
                     goingForward:(int)goingForward;

@end
