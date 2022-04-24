#import <Foundation/Foundation.h>
#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0RCTOnPageScrollEvent : NSObject <ABI45_0_0RCTEvent>

- (instancetype) initWithABI45_0_0ReactTag:(NSNumber *)ABI45_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;

@end

NS_ASSUME_NONNULL_END
