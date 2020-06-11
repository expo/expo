#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManagerObserverCoordinator.h>
#import "ABI38_0_0RNSScreenContainer.h"

@interface ABI38_0_0RNSScreenStackView : UIView <ABI38_0_0RNSScreenContainerDelegate, ABI38_0_0RCTInvalidating>

@property (nonatomic, copy) ABI38_0_0RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI38_0_0RNSScreenStackManager : ABI38_0_0RCTViewManager <ABI38_0_0RCTInvalidating>

@end
