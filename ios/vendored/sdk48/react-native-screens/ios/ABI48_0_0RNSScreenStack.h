#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTViewComponentView.h>
#else
#import <ABI48_0_0React/ABI48_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>
#endif

#import "ABI48_0_0RNSScreenContainer.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0RNScreensNavigationController : UINavigationController <ABI48_0_0RNScreensViewControllerDelegate>

@end

@interface ABI48_0_0RNSScreenStackView :
#ifdef RN_FABRIC_ENABLED
    ABI48_0_0RCTViewComponentView <ABI48_0_0RNSScreenContainerDelegate>
#else
    UIView <ABI48_0_0RNSScreenContainerDelegate, ABI48_0_0RCTInvalidating>
#endif

- (void)markChildUpdated;
- (void)didUpdateChildren;

#ifdef RN_FABRIC_ENABLED
#else
@property (nonatomic, copy) ABI48_0_0RCTDirectEventBlock onFinishTransitioning;
#endif // RN_FABRIC_ENABLED

@end

@interface ABI48_0_0RNSScreenStackManager : ABI48_0_0RCTViewManager <ABI48_0_0RCTInvalidating>

@end

NS_ASSUME_NONNULL_END
