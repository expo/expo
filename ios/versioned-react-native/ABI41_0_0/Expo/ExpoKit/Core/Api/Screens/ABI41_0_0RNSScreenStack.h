#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI41_0_0RNSScreenContainer.h"

@interface ABI41_0_0RNScreensNavigationController: UINavigationController <ABI41_0_0RNScreensViewControllerDelegate>

@end

@interface ABI41_0_0RNSScreenStackView : UIView <ABI41_0_0RNSScreenContainerDelegate, ABI41_0_0RCTInvalidating>

@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI41_0_0RNSScreenStackManager : ABI41_0_0RCTViewManager <ABI41_0_0RCTInvalidating>

@end
