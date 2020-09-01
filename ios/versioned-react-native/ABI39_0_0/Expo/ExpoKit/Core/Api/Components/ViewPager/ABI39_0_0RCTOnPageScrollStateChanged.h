#import <Foundation/Foundation.h>
#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0RCTOnPageScrollStateChanged : NSObject <ABI39_0_0RCTEvent>

- (instancetype) initWithABI39_0_0ReactTag:(NSNumber *)ABI39_0_0ReactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
