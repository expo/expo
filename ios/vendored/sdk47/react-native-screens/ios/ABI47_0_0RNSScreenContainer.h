#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTViewComponentView.h>
#else
#endif

#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI47_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;
- (void)updateContainer;

@end

@protocol ABI47_0_0RNScreensViewControllerDelegate

@end

@interface ABI47_0_0RNScreensViewController : UIViewController <ABI47_0_0RNScreensViewControllerDelegate>

- (UIViewController *)findActiveChildVC;

@end

@interface ABI47_0_0RNSScreenContainerManager : ABI47_0_0RCTViewManager

@end

@interface ABI47_0_0RNSScreenContainerView :
#ifdef RN_FABRIC_ENABLED
    ABI47_0_0RCTViewComponentView <ABI47_0_0RNSScreenContainerDelegate>
#else
    UIView <ABI47_0_0RNSScreenContainerDelegate, ABI47_0_0RCTInvalidating>
#endif

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableArray *ABI47_0_0ReactSubviews;

- (void)maybeDismissVC;

@end

NS_ASSUME_NONNULL_END
