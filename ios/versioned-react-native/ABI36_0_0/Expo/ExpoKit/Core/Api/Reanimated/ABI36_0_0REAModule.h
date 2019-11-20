#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventDispatcher.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventEmitter.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManager.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManagerUtils.h>

#import "ABI36_0_0REAValueNode.h"

@interface ABI36_0_0REAModule : ABI36_0_0RCTEventEmitter <ABI36_0_0RCTBridgeModule, ABI36_0_0RCTEventDispatcherObserver, ABI36_0_0RCTUIManagerObserver>

@end
