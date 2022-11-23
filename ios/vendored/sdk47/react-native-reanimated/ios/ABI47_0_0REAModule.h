#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventDispatcher.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventEmitter.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManagerUtils.h>

#import <ABI47_0_0RNReanimated/ABI47_0_0REAValueNode.h>

@interface ABI47_0_0REAModule : ABI47_0_0RCTEventEmitter <ABI47_0_0RCTBridgeModule, ABI47_0_0RCTEventDispatcherObserver, ABI47_0_0RCTUIManagerObserver>

@property (nonatomic, readonly) ABI47_0_0REANodesManager *nodesManager;

@end
