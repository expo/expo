#import <ReactABI32_0_0/ABI32_0_0RCTBridgeModule.h>
#import <ReactABI32_0_0/ABI32_0_0RCTEventDispatcher.h>
#import <ReactABI32_0_0/ABI32_0_0RCTEventEmitter.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManager.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManagerUtils.h>

#import "ABI32_0_0REAValueNode.h"

@interface ABI32_0_0REAModule : ABI32_0_0RCTEventEmitter <ABI32_0_0RCTBridgeModule, ABI32_0_0RCTEventDispatcherObserver, ABI32_0_0RCTUIManagerObserver>

@end
