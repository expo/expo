#import <React/RCTViewManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>
#import "RNSScreenContainer.h"

@interface RNSScreenStackView : UIView <RNSScreenContainerDelegate>

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface RNSScreenStackManager : RCTViewManager <RCTInvalidating>

@end
