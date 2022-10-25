#import <Foundation/Foundation.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0RCTOnPageSelected : NSObject <ABI47_0_0RCTEvent>

- (instancetype) initWithABI47_0_0ReactTag:(NSNumber *)ABI47_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
