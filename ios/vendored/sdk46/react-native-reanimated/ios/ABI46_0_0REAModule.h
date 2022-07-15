#import <ABI46_0_0React/ABI46_0_0RCTBridgeModule.h>
#import <ABI46_0_0React/ABI46_0_0RCTEventDispatcher.h>
#import <ABI46_0_0React/ABI46_0_0RCTEventEmitter.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManagerUtils.h>

#import <ABI46_0_0RNReanimated/ABI46_0_0REAValueNode.h>

@interface ABI46_0_0REAModule : ABI46_0_0RCTEventEmitter <ABI46_0_0RCTBridgeModule, ABI46_0_0RCTEventDispatcherObserver, ABI46_0_0RCTUIManagerObserver>

@property (nonatomic, readonly) ABI46_0_0REANodesManager *nodesManager;

@end
