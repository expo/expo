#ifdef RN_FABRIC_ENABLED
#import <ABI47_0_0React/ABI47_0_0RCTViewComponentView.h>
#else
#import <ABI47_0_0React/ABI47_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>
#endif

#import "ABI47_0_0RNSScreenContainer.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0RNScreensNavigationController : UINavigationController <ABI47_0_0RNScreensViewControllerDelegate>

@end

@interface ABI47_0_0RNSScreenStackView :
#ifdef RN_FABRIC_ENABLED
    ABI47_0_0RCTViewComponentView <ABI47_0_0RNSScreenContainerDelegate>
#else
    UIView <ABI47_0_0RNSScreenContainerDelegate, ABI47_0_0RCTInvalidating>
#endif

- (void)markChildUpdated;
- (void)didUpdateChildren;

#ifdef RN_FABRIC_ENABLED
#else
@property (nonatomic, copy) ABI47_0_0RCTDirectEventBlock onFinishTransitioning;
#endif // RN_FABRIC_ENABLED

@end

@interface ABI47_0_0RNSScreenStackManager : ABI47_0_0RCTViewManager <ABI47_0_0RCTInvalidating>

@end

NS_ASSUME_NONNULL_END
