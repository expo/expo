#import <Foundation/Foundation.h>
#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0RCTOnPageScrollStateChanged : NSObject <ABI42_0_0RCTEvent>

- (instancetype) initWithABI42_0_0ReactTag:(NSNumber *)ABI42_0_0ReactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
