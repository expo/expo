#import <React/RCTViewManager.h>

@protocol RNSScreenContainerDelegate

- (void)markChildUpdated;

@end

@protocol RNScreensViewControllerDelegate

@end

@interface RNScreensViewController: UIViewController <RNScreensViewControllerDelegate>

@end

@interface RNSScreenContainerView : UIView <RNSScreenContainerDelegate>

@end
