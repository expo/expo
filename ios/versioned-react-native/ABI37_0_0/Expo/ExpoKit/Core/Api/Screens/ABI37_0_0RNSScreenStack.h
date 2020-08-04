#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerObserverCoordinator.h>
#import "ABI37_0_0RNSScreenContainer.h"

@interface ABI37_0_0RNSScreenStackView : UIView <ABI37_0_0RNSScreenContainerDelegate, ABI37_0_0RCTInvalidating>

@property (nonatomic, copy) ABI37_0_0RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI37_0_0RNSScreenStackManager : ABI37_0_0RCTViewManager <ABI37_0_0RCTInvalidating>

@end
