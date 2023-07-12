#import <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcherProtocol.h>

@interface ABI49_0_0RNSScreenViewEvent : NSObject <ABI49_0_0RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName
                         ABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag
                         progress:(double)progress
                          closing:(int)closing
                     goingForward:(int)goingForward;

@end
