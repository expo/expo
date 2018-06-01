#import <ReactABI28_0_0/ABI28_0_0RCTBridgeModule.h>
#import <ReactABI28_0_0/ABI28_0_0RCTEventDispatcher.h>
#import <ReactABI28_0_0/ABI28_0_0RCTEventEmitter.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManagerUtils.h>

#import "ABI28_0_0REAValueNode.h"

@interface ABI28_0_0REAModule : ABI28_0_0RCTEventEmitter <ABI28_0_0RCTBridgeModule, ABI28_0_0RCTEventDispatcherObserver, ABI28_0_0RCTUIManagerObserver>

@end
