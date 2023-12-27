#import <Foundation/Foundation.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0RCTOnPageSelected : NSObject <ABI43_0_0RCTEvent>

- (instancetype) initWithABI43_0_0ReactTag:(NSNumber *)ABI43_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
