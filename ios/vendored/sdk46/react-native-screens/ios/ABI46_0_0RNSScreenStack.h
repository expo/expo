#ifdef RN_FABRIC_ENABLED
#import <ABI46_0_0React/ABI46_0_0RCTViewComponentView.h>
#else
#import <ABI46_0_0React/ABI46_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>
#endif

#import "ABI46_0_0RNSScreenContainer.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0RNScreensNavigationController : UINavigationController <ABI46_0_0RNScreensViewControllerDelegate>

@end

@interface ABI46_0_0RNSScreenStackView :
#ifdef RN_FABRIC_ENABLED
    ABI46_0_0RCTViewComponentView <ABI46_0_0RNSScreenContainerDelegate>
#else
    UIView <ABI46_0_0RNSScreenContainerDelegate, ABI46_0_0RCTInvalidating>
#endif

- (void)markChildUpdated;
- (void)didUpdateChildren;

#ifdef RN_FABRIC_ENABLED
#else
@property (nonatomic, copy) ABI46_0_0RCTDirectEventBlock onFinishTransitioning;
#endif // RN_FABRIC_ENABLED

@end

@interface ABI46_0_0RNSScreenStackManager : ABI46_0_0RCTViewManager <ABI46_0_0RCTInvalidating>

@end

NS_ASSUME_NONNULL_END
