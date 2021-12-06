#import <Foundation/Foundation.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0RCTOnPageScrollEvent : NSObject <ABI44_0_0RCTEvent>

- (instancetype) initWithABI44_0_0ReactTag:(NSNumber *)ABI44_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;

@end

NS_ASSUME_NONNULL_END
