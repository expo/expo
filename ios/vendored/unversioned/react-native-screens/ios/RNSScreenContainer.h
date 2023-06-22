#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#else
#endif

#import <React/RCTViewManager.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RNSScreenContainerDelegate

- (void)markChildUpdated;
- (void)updateContainer;

@end

@protocol RNScreensViewControllerDelegate

@end

@interface RNScreensViewController : UIViewController <RNScreensViewControllerDelegate>

- (UIViewController *)findActiveChildVC;

@end

@interface RNSScreenContainerManager : RCTViewManager

@end

@interface RNSScreenContainerView :
#ifdef RCT_NEW_ARCH_ENABLED
    RCTViewComponentView <RNSScreenContainerDelegate>
#else
    UIView <RNSScreenContainerDelegate, RCTInvalidating>
#endif

@property (nonatomic, retain) UIViewController *controller;
@property (nonatomic, retain) NSMutableArray *reactSubviews;

- (void)maybeDismissVC;

@end

NS_ASSUME_NONNULL_END
