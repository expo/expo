#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>

@protocol ABI40_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@protocol ABI40_0_0RNScreensViewControllerDelegate

@end

@interface ABI40_0_0RNScreensViewController: UIViewController <ABI40_0_0RNScreensViewControllerDelegate>

@end

@interface ABI40_0_0RNSScreenContainerView : UIView <ABI40_0_0RNSScreenContainerDelegate>

@end
