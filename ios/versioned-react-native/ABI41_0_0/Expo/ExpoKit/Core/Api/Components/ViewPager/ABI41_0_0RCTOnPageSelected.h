#import <Foundation/Foundation.h>
#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0RCTOnPageSelected : NSObject <ABI41_0_0RCTEvent>

- (instancetype) initWithABI41_0_0ReactTag:(NSNumber *)ABI41_0_0ReactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
