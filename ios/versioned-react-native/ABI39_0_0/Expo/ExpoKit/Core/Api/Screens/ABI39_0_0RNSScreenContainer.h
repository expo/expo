#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>

@protocol ABI39_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface ABI39_0_0RNSScreenContainerView : UIView <ABI39_0_0RNSScreenContainerDelegate>
@end
