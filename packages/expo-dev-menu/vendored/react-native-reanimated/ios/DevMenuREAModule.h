#import <React/RCTBridgeModule.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>
#import <React/RCTUIManagerUtils.h>

#import "DevMenuREAValueNode.h"

extern RCTBridge *_devmenu_bridge_reanimated;

@interface DevMenuREAModule : RCTEventEmitter <RCTBridgeModule, RCTEventDispatcherObserver, RCTUIManagerObserver>

@property (nonatomic, readonly) DevMenuREANodesManager *nodesManager;

@end
