#import <Foundation/Foundation.h>
#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0RCTOnPageSelected : NSObject <ABI40_0_0RCTEvent>

- (instancetype) initWithABI40_0_0ReactTag:(NSNumber *)ABI40_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
