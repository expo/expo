#import <ReactABI30_0_0/ABI30_0_0RCTViewManager.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManagerObserverCoordinator.h>
#import "ABI30_0_0RNSScreenContainer.h"

@interface ABI30_0_0RNSScreenStackView : UIView <ABI30_0_0RNSScreenContainerDelegate>

- (void)markChildUpdated;
- (void)didUpdateChildren;

@end

@interface ABI30_0_0RNSScreenStackManager : ABI30_0_0RCTViewManager

@end
