#import <ReactABI31_0_0/ABI31_0_0RCTViewManager.h>

@protocol ABI31_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface ABI31_0_0RNSScreenContainerView : UIView <ABI31_0_0RNSScreenContainerDelegate>
@end
