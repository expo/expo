#import <Foundation/Foundation.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0RCTOnPageScrollStateChanged : NSObject <ABI43_0_0RCTEvent>

- (instancetype) initWithABI43_0_0ReactTag:(NSNumber *)ABI43_0_0ReactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
