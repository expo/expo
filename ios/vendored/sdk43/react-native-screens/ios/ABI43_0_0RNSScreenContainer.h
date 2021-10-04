#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

@protocol ABI43_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;
- (void)updateContainer;

@end

@protocol ABI43_0_0RNScreensViewControllerDelegate

@end

@interface ABI43_0_0RNScreensViewController : UIViewController <ABI43_0_0RNScreensViewControllerDelegate>

- (UIViewController *)findActiveChildVC;

@end

@interface ABI43_0_0RNSScreenContainerManager : ABI43_0_0RCTViewManager

@end

@interface ABI43_0_0RNSScreenContainerView : UIView <ABI43_0_0RNSScreenContainerDelegate, ABI43_0_0RCTInvalidating>

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableArray *ABI43_0_0ReactSubviews;

- (void)maybeDismissVC;

@end
