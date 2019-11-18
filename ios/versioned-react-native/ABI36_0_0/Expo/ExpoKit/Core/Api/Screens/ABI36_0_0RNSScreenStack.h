#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManagerObserverCoordinator.h>
#import "ABI36_0_0RNSScreenContainer.h"

@interface ABI36_0_0RNSScreenStackView : UIView <ABI36_0_0RNSScreenContainerDelegate>

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI36_0_0RNSScreenStackManager : ABI36_0_0RCTViewManager <ABI36_0_0RCTInvalidating>

@end
