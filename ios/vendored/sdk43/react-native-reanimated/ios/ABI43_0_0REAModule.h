#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventDispatcher.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventEmitter.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManagerUtils.h>

#import "ABI43_0_0REAValueNode.h"

extern ABI43_0_0RCTBridge *ABI43_0_0_bridge_reanimated;

@interface ABI43_0_0REAModule : ABI43_0_0RCTEventEmitter <ABI43_0_0RCTBridgeModule, ABI43_0_0RCTEventDispatcherObserver, ABI43_0_0RCTUIManagerObserver>

@property (nonatomic, readonly) ABI43_0_0REANodesManager *nodesManager;

@end
