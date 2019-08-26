#import <ReactABI32_0_0/ABI32_0_0RCTViewManager.h>

@protocol ABI32_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface ABI32_0_0RNSScreenContainerView : UIView <ABI32_0_0RNSScreenContainerDelegate>
@end
