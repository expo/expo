#import <ReactABI33_0_0/ABI33_0_0RCTViewManager.h>

@protocol ABI33_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface ABI33_0_0RNSScreenContainerView : UIView <ABI33_0_0RNSScreenContainerDelegate>
@end
