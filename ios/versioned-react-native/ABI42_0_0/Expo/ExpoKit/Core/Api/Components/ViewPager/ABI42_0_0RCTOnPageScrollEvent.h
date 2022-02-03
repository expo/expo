#import <Foundation/Foundation.h>
#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0RCTOnPageScrollEvent : NSObject <ABI42_0_0RCTEvent>

- (instancetype) initWithABI42_0_0ReactTag:(NSNumber *)ABI42_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;

@end

NS_ASSUME_NONNULL_END
