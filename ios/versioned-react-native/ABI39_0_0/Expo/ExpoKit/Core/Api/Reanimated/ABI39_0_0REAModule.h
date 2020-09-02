#import <ABI39_0_0React/ABI39_0_0RCTBridgeModule.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventEmitter.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManager.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManagerUtils.h>

#import "ABI39_0_0REAValueNode.h"

extern ABI39_0_0RCTBridge *ABI39_0_0_bridge_reanimated;

@interface ABI39_0_0REAModule : ABI39_0_0RCTEventEmitter <ABI39_0_0RCTBridgeModule, ABI39_0_0RCTEventDispatcherObserver, ABI39_0_0RCTUIManagerObserver>

@property (nonatomic, readonly) ABI39_0_0REANodesManager *nodesManager;

@end
