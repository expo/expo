#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventDispatcher.h>
#import <ReactABI34_0_0/ABI34_0_0RCTEventEmitter.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManager.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManagerUtils.h>

#import "ABI34_0_0REAValueNode.h"

@interface ABI34_0_0REAModule : ABI34_0_0RCTEventEmitter <ABI34_0_0RCTBridgeModule, ABI34_0_0RCTEventDispatcherObserver, ABI34_0_0RCTUIManagerObserver>

@end
