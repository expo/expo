#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventEmitter.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManagerUtils.h>

#import "ABI41_0_0REAValueNode.h"

extern ABI41_0_0RCTBridge *ABI41_0_0_bridge_reanimated;

@interface ABI41_0_0REAModule : ABI41_0_0RCTEventEmitter <ABI41_0_0RCTBridgeModule, ABI41_0_0RCTEventDispatcherObserver, ABI41_0_0RCTUIManagerObserver>

@property (nonatomic, readonly) ABI41_0_0REANodesManager *nodesManager;

@end
