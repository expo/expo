#import <Foundation/Foundation.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0RCTOnPageSelected : NSObject <ABI44_0_0RCTEvent>

- (instancetype) initWithABI44_0_0ReactTag:(NSNumber *)ABI44_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
