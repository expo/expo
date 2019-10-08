#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>

@protocol ABI35_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface ABI35_0_0RNSScreenContainerView : UIView <ABI35_0_0RNSScreenContainerDelegate>
@end
