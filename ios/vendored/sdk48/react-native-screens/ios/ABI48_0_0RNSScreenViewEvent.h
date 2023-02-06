#import <ABI48_0_0React/ABI48_0_0RCTBridge+Private.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventDispatcherProtocol.h>

@interface ABI48_0_0RNSScreenViewEvent : NSObject <ABI48_0_0RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName
                         ABI48_0_0ReactTag:(NSNumber *)ABI48_0_0ReactTag
                         progress:(double)progress
                          closing:(int)closing
                     goingForward:(int)goingForward;

@end
