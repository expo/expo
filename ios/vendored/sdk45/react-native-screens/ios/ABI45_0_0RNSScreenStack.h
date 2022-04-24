#import <ABI45_0_0React/ABI45_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>

#import "ABI45_0_0RNSScreenContainer.h"

@interface ABI45_0_0RNScreensNavigationController : UINavigationController <ABI45_0_0RNScreensViewControllerDelegate>

@end

@interface ABI45_0_0RNSScreenStackView : UIView <ABI45_0_0RNSScreenContainerDelegate, ABI45_0_0RCTInvalidating>

@property (nonatomic, copy) ABI45_0_0RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI45_0_0RNSScreenStackManager : ABI45_0_0RCTViewManager <ABI45_0_0RCTInvalidating>

@end
