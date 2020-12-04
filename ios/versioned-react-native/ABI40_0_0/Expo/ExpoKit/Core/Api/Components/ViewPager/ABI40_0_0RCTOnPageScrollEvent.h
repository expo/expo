#import <Foundation/Foundation.h>
#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0RCTOnPageScrollEvent : NSObject <ABI40_0_0RCTEvent>

- (instancetype) initWithABI40_0_0ReactTag:(NSNumber *)ABI40_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;

@end

NS_ASSUME_NONNULL_END
