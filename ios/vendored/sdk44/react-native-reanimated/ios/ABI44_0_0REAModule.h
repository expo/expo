#import <ABI44_0_0React/ABI44_0_0RCTBridgeModule.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventEmitter.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManagerUtils.h>

#import "ABI44_0_0REAValueNode.h"

@interface ABI44_0_0REAModule : ABI44_0_0RCTEventEmitter <ABI44_0_0RCTBridgeModule, ABI44_0_0RCTEventDispatcherObserver, ABI44_0_0RCTUIManagerObserver>

@property (nonatomic, readonly) ABI44_0_0REANodesManager *nodesManager;

@end
