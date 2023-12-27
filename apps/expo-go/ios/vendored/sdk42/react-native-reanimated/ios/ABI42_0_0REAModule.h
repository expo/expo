#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventEmitter.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManager.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI42_0_0React/ABI42_0_0RCTUIManagerUtils.h>

#import "ABI42_0_0REAValueNode.h"

extern ABI42_0_0RCTBridge *ABI42_0_0_bridge_reanimated;

@interface ABI42_0_0REAModule : ABI42_0_0RCTEventEmitter <ABI42_0_0RCTBridgeModule, ABI42_0_0RCTEventDispatcherObserver, ABI42_0_0RCTUIManagerObserver>

@property (nonatomic, readonly) ABI42_0_0REANodesManager *nodesManager;

@end
