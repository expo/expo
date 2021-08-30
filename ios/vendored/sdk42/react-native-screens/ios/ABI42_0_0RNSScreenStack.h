#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManagerObserverCoordinator.h>

#import "ABI42_0_0RNSScreenContainer.h"

@interface ABI42_0_0RNScreensNavigationController: UINavigationController <ABI42_0_0RNScreensViewControllerDelegate>

@end

@interface ABI42_0_0RNSScreenStackView : UIView <ABI42_0_0RNSScreenContainerDelegate, ABI42_0_0RCTInvalidating>

@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI42_0_0RNSScreenStackManager : ABI42_0_0RCTViewManager <ABI42_0_0RCTInvalidating>

@end
