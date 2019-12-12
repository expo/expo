#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>

@protocol ABI36_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface ABI36_0_0RNSScreenContainerView : UIView <ABI36_0_0RNSScreenContainerDelegate>
@end
