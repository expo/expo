#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0RCTOnPageSelected : NSObject <ABI49_0_0RCTEvent>

- (instancetype) initWithABI49_0_0ReactTag:(NSNumber *)ABI49_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
