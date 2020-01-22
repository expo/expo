#import <ReactABI34_0_0/ABI34_0_0RCTViewManager.h>

@protocol ABI34_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface ABI34_0_0RNSScreenContainerView : UIView <ABI34_0_0RNSScreenContainerDelegate>
@end
