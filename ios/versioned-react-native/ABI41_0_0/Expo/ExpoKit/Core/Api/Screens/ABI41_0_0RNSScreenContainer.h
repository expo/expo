#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>

@protocol ABI41_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@protocol ABI41_0_0RNScreensViewControllerDelegate

@end

@interface ABI41_0_0RNScreensViewController: UIViewController <ABI41_0_0RNScreensViewControllerDelegate>

@end

@interface ABI41_0_0RNSScreenContainerView : UIView <ABI41_0_0RNSScreenContainerDelegate>

@end
