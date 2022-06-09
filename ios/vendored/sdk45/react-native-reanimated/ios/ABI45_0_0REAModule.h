#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventDispatcher.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventEmitter.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManagerUtils.h>

#import <ABI45_0_0RNReanimated/ABI45_0_0REAValueNode.h>

@interface ABI45_0_0REAModule : ABI45_0_0RCTEventEmitter <ABI45_0_0RCTBridgeModule, ABI45_0_0RCTEventDispatcherObserver, ABI45_0_0RCTUIManagerObserver>

@property (nonatomic, readonly) ABI45_0_0REANodesManager *nodesManager;

@end
