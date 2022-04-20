#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>

@protocol ABI45_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;
- (void)updateContainer;

@end

@protocol ABI45_0_0RNScreensViewControllerDelegate

@end

@interface ABI45_0_0RNScreensViewController : UIViewController <ABI45_0_0RNScreensViewControllerDelegate>

- (UIViewController *)findActiveChildVC;

@end

@interface ABI45_0_0RNSScreenContainerManager : ABI45_0_0RCTViewManager

@end

@interface ABI45_0_0RNSScreenContainerView : UIView <ABI45_0_0RNSScreenContainerDelegate, ABI45_0_0RCTInvalidating>

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableArray *ABI45_0_0ReactSubviews;

- (void)maybeDismissVC;

@end
