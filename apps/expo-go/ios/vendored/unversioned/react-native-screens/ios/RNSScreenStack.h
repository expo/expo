#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#else
#import <React/RCTUIManagerObserverCoordinator.h>
#import <React/RCTViewManager.h>
#endif

#import "RNSScreenContainer.h"

NS_ASSUME_NONNULL_BEGIN

@interface RNSNavigationController : UINavigationController <RNSViewControllerDelegate>

@end

@interface RNSScreenStackView :
#ifdef RCT_NEW_ARCH_ENABLED
    RCTViewComponentView <RNSScreenContainerDelegate>
#else
    UIView <RNSScreenContainerDelegate, RCTInvalidating>
#endif

- (void)markChildUpdated;
- (void)didUpdateChildren;

#ifdef RCT_NEW_ARCH_ENABLED
#else
@property (nonatomic, copy) RCTDirectEventBlock onFinishTransitioning;
#endif // RCT_NEW_ARCH_ENABLED

@end

@interface RNSScreenStackManager : RCTViewManager <RCTInvalidating>

@end

NS_ASSUME_NONNULL_END
