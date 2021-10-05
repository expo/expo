#import <ABI43_0_0React/ABI43_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

#import "ABI43_0_0RNSScreenContainer.h"

@interface ABI43_0_0RNScreensNavigationController : UINavigationController <ABI43_0_0RNScreensViewControllerDelegate>

@end

@interface ABI43_0_0RNSScreenStackView : UIView <ABI43_0_0RNSScreenContainerDelegate, ABI43_0_0RCTInvalidating>

@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI43_0_0RNSScreenStackManager : ABI43_0_0RCTViewManager <ABI43_0_0RCTInvalidating>

@end
