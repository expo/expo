#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI40_0_0RNSScreenContainer.h"

@interface ABI40_0_0RNScreensNavigationController: UINavigationController <ABI40_0_0RNScreensViewControllerDelegate>

@end

@interface ABI40_0_0RNSScreenStackView : UIView <ABI40_0_0RNSScreenContainerDelegate, ABI40_0_0RCTInvalidating>

@property (nonatomic, copy) ABI40_0_0RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI40_0_0RNSScreenStackManager : ABI40_0_0RCTViewManager <ABI40_0_0RCTInvalidating>

@end
