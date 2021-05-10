#import <ABI39_0_0React/ABI39_0_0RCTViewManager.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManagerObserverCoordinator.h>
#import "ABI39_0_0RNSScreenContainer.h"

@interface ABI39_0_0RNSScreenStackView : UIView <ABI39_0_0RNSScreenContainerDelegate, ABI39_0_0RCTInvalidating>

@property (nonatomic, copy) ABI39_0_0RCTDirectEventBlock onFinishTransitioning;

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI39_0_0RNSScreenStackManager : ABI39_0_0RCTViewManager <ABI39_0_0RCTInvalidating>

@end
