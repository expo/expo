#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTViewComponentView.h>
#else
#endif

#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI48_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;
- (void)updateContainer;

@end

@protocol ABI48_0_0RNScreensViewControllerDelegate

@end

@interface ABI48_0_0RNScreensViewController : UIViewController <ABI48_0_0RNScreensViewControllerDelegate>

- (UIViewController *)findActiveChildVC;

@end

@interface ABI48_0_0RNSScreenContainerManager : ABI48_0_0RCTViewManager

@end

@interface ABI48_0_0RNSScreenContainerView :
#ifdef RN_FABRIC_ENABLED
    ABI48_0_0RCTViewComponentView <ABI48_0_0RNSScreenContainerDelegate>
#else
    UIView <ABI48_0_0RNSScreenContainerDelegate, ABI48_0_0RCTInvalidating>
#endif

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableArray *ABI48_0_0ReactSubviews;

- (void)maybeDismissVC;

@end

NS_ASSUME_NONNULL_END
