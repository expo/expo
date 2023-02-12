#ifdef RN_FABRIC_ENABLED
#import <ABI46_0_0React/ABI46_0_0RCTViewComponentView.h>
#else
#endif

#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI46_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;
- (void)updateContainer;

@end

@protocol ABI46_0_0RNScreensViewControllerDelegate

@end

@interface ABI46_0_0RNScreensViewController : UIViewController <ABI46_0_0RNScreensViewControllerDelegate>

- (UIViewController *)findActiveChildVC;

@end

@interface ABI46_0_0RNSScreenContainerManager : ABI46_0_0RCTViewManager

@end

@interface ABI46_0_0RNSScreenContainerView :
#ifdef RN_FABRIC_ENABLED
    ABI46_0_0RCTViewComponentView <ABI46_0_0RNSScreenContainerDelegate>
#else
    UIView <ABI46_0_0RNSScreenContainerDelegate, ABI46_0_0RCTInvalidating>
#endif

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableArray *ABI46_0_0ReactSubviews;

- (void)maybeDismissVC;

@end

NS_ASSUME_NONNULL_END
