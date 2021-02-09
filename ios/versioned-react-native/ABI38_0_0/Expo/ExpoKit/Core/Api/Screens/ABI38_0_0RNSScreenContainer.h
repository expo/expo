#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>

@protocol ABI38_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface ABI38_0_0RNSScreenContainerView : UIView <ABI38_0_0RNSScreenContainerDelegate>
@end
