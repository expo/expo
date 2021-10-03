#import <Foundation/Foundation.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0RCTOnPageScrollEvent : NSObject <ABI43_0_0RCTEvent>

- (instancetype) initWithABI43_0_0ReactTag:(NSNumber *)ABI43_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;

@end

NS_ASSUME_NONNULL_END
