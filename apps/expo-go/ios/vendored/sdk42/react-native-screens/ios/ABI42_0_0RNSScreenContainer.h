#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>

@protocol ABI42_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@protocol ABI42_0_0RNScreensViewControllerDelegate

@end

@interface ABI42_0_0RNScreensViewController: UIViewController <ABI42_0_0RNScreensViewControllerDelegate>

@end

@interface ABI42_0_0RNSScreenContainerView : UIView <ABI42_0_0RNSScreenContainerDelegate>

@end
