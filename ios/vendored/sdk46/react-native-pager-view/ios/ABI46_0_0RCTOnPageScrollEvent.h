#import <Foundation/Foundation.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0RCTOnPageScrollEvent : NSObject <ABI46_0_0RCTEvent>

- (instancetype) initWithABI46_0_0ReactTag:(NSNumber *)ABI46_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;

@end

NS_ASSUME_NONNULL_END
