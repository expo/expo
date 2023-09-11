#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>
#else
#endif

#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI49_0_0RNSScreenContainerDelegate

- (void)markChildUpdated;
- (void)updateContainer;

@end

@protocol ABI49_0_0RNScreensViewControllerDelegate

@end

@interface ABI49_0_0RNScreensViewController : UIViewController <ABI49_0_0RNScreensViewControllerDelegate>

- (UIViewController *)findActiveChildVC;

@end

@interface ABI49_0_0RNSScreenContainerManager : ABI49_0_0RCTViewManager

@end

@interface ABI49_0_0RNSScreenContainerView :
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    ABI49_0_0RCTViewComponentView <ABI49_0_0RNSScreenContainerDelegate>
#else
    UIView <ABI49_0_0RNSScreenContainerDelegate, ABI49_0_0RCTInvalidating>
#endif

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableArray *ABI49_0_0ReactSubviews;

- (void)maybeDismissVC;

@end

NS_ASSUME_NONNULL_END
