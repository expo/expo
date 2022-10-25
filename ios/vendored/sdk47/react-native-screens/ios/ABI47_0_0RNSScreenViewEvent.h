#import <ABI47_0_0React/ABI47_0_0RCTBridge+Private.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcherProtocol.h>

@interface ABI47_0_0RNSScreenViewEvent : NSObject <ABI47_0_0RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName
                         ABI47_0_0ReactTag:(NSNumber *)ABI47_0_0ReactTag
                         progress:(double)progress
                          closing:(int)closing
                     goingForward:(int)goingForward;

@end
