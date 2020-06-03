#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventDispatcher.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventEmitter.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManagerObserverCoordinator.h>
#import <ABI38_0_0React/ABI38_0_0RCTUIManagerUtils.h>

#import "ABI38_0_0REAValueNode.h"

@interface ABI38_0_0REAModule : ABI38_0_0RCTEventEmitter <ABI38_0_0RCTBridgeModule, ABI38_0_0RCTEventDispatcherObserver, ABI38_0_0RCTUIManagerObserver>

@end
