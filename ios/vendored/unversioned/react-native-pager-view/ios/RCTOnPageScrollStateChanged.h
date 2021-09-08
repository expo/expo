#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTOnPageScrollStateChanged : NSObject <RCTEvent>

- (instancetype) initWithReactTag:(NSNumber *)reactTag
                            state:(NSString *)state
                    coalescingKey:(uint16_t)coalescingKey;

@end

NS_ASSUME_NONNULL_END
