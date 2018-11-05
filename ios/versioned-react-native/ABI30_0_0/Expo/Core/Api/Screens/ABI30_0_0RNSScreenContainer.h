#import <ReactABI30_0_0/ABI30_0_0RCTViewManager.h>

@protocol ABI30_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@interface ABI30_0_0RNSScreenContainerView : UIView <ABI30_0_0RNSScreenContainerDelegate>
@end
