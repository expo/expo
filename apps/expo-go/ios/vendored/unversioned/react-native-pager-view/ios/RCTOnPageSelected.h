#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTOnPageSelected : NSObject <RCTEvent>

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                         position:(NSNumber *)position
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
