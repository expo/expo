#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>

@protocol ABI37_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface ABI37_0_0RNSScreenContainerView : UIView <ABI37_0_0RNSScreenContainerDelegate>
@end
