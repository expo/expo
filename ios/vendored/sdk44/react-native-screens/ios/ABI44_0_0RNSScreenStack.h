#import <ABI44_0_0React/ABI44_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI44_0_0React/ABI44_0_0RCTViewManager.h>

#import "ABI44_0_0RNSScreenContainer.h"

@interface ABI44_0_0RNScreensNavigationController : UINavigationController <ABI44_0_0RNScreensViewControllerDelegate>

@end

@interface ABI44_0_0RNSScreenStackView : UIView <ABI44_0_0RNSScreenContainerDelegate, ABI44_0_0RCTInvalidating>

@property (nonatomic, copy) ABI44_0_0RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI44_0_0RNSScreenStackManager : ABI44_0_0RCTViewManager <ABI44_0_0RCTInvalidating>

@end
