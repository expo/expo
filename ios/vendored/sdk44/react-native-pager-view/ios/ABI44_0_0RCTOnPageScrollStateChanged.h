#import <Foundation/Foundation.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0RCTOnPageScrollStateChanged : NSObject <ABI44_0_0RCTEvent>

- (instancetype) initWithABI44_0_0ReactTag:(NSNumber *)ABI44_0_0ReactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
