#import <Foundation/Foundation.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0RCTOnPageSelected : NSObject <ABI46_0_0RCTEvent>

- (instancetype) initWithABI46_0_0ReactTag:(NSNumber *)ABI46_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
