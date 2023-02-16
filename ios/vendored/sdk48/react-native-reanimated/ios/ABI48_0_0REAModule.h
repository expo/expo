#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventDispatcher.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventEmitter.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManagerUtils.h>

#import <ABI48_0_0RNReanimated/ABI48_0_0REAValueNode.h>

@interface ABI48_0_0REAModule : ABI48_0_0RCTEventEmitter <ABI48_0_0RCTBridgeModule, ABI48_0_0RCTEventDispatcherObserver, ABI48_0_0RCTUIManagerObserver>

@property (nonatomic, readonly) ABI48_0_0REANodesManager *nodesManager;

@end
