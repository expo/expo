#import <Foundation/Foundation.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0RCTOnPageScrollEvent : NSObject <ABI48_0_0RCTEvent>

- (instancetype) initWithABI48_0_0ReactTag:(NSNumber *)ABI48_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;

@end

NS_ASSUME_NONNULL_END
