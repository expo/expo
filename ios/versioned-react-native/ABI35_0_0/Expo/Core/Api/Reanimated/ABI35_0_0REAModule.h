#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>
#import <ReactABI35_0_0/ABI35_0_0RCTEventDispatcher.h>
#import <ReactABI35_0_0/ABI35_0_0RCTEventEmitter.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManager.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManagerUtils.h>

#import "ABI35_0_0REAValueNode.h"

@interface ABI35_0_0REAModule : ABI35_0_0RCTEventEmitter <ABI35_0_0RCTBridgeModule, ABI35_0_0RCTEventDispatcherObserver, ABI35_0_0RCTUIManagerObserver>

@end
