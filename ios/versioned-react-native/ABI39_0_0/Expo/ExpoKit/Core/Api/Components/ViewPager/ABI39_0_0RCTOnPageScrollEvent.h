#import <Foundation/Foundation.h>
#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0RCTOnPageScrollEvent : NSObject <ABI39_0_0RCTEvent>

- (instancetype) initWithABI39_0_0ReactTag:(NSNumber *)ABI39_0_0ReactTag
                         position:(NSNumber *)position
                           offset:(NSNumber *)offset;

@end

NS_ASSUME_NONNULL_END
