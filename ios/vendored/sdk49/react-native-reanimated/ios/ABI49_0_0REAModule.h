#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0RNReanimated/NewestShadowNodesRegistry.h>
#import <ABI49_0_0RNReanimated/ReanimatedUIManagerBinding.h>
#endif

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventEmitter.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManagerUtils.h>

#import <ABI49_0_0RNReanimated/ABI49_0_0REANodesManager.h>

@interface ABI49_0_0REAModule : ABI49_0_0RCTEventEmitter <ABI49_0_0RCTBridgeModule, ABI49_0_0RCTEventDispatcherObserver, ABI49_0_0RCTUIManagerObserver>

@property (nonatomic, readonly) ABI49_0_0REANodesManager *nodesManager;

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
- (void)installReanimatedUIManagerBindingAfterReload;
#endif

@end
