#import <React/RCTBridge+Private.h>
#import <React/RCTEventDispatcherProtocol.h>

@interface RNSHeaderHeightChangeEvent : NSObject <RCTEvent>

- (instancetype)initWithEventName:(NSString *)eventName reactTag:(NSNumber *)reactTag headerHeight:(double)headerHeight;

@end
