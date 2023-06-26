#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>
#else
#import <ABI49_0_0React/ABI49_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>
#endif

#import "ABI49_0_0RNSScreenContainer.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0RNScreensNavigationController : UINavigationController <ABI49_0_0RNScreensViewControllerDelegate>

@end

@interface ABI49_0_0RNSScreenStackView :
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    ABI49_0_0RCTViewComponentView <ABI49_0_0RNSScreenContainerDelegate>
#else
    UIView <ABI49_0_0RNSScreenContainerDelegate, ABI49_0_0RCTInvalidating>
#endif

- (void)markChildUpdated;
- (void)didUpdateChildren;

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#else
@property (nonatomic, copy) ABI49_0_0RCTDirectEventBlock onFinishTransitioning;
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@end

@interface ABI49_0_0RNSScreenStackManager : ABI49_0_0RCTViewManager <ABI49_0_0RCTInvalidating>

@end

NS_ASSUME_NONNULL_END
