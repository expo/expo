#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>

@protocol ABI44_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;
- (void)updateContainer;

@end

@protocol ABI44_0_0RNScreensViewControllerDelegate

@end

@interface ABI44_0_0RNScreensViewController : UIViewController <ABI44_0_0RNScreensViewControllerDelegate>

- (UIViewController *)findActiveChildVC;

@end

@interface ABI44_0_0RNSScreenContainerManager : ABI44_0_0RCTViewManager

@end

@interface ABI44_0_0RNSScreenContainerView : UIView <ABI44_0_0RNSScreenContainerDelegate, ABI44_0_0RCTInvalidating>

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableArray *ABI44_0_0ReactSubviews;

- (void)maybeDismissVC;

@end
