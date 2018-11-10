#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>
#import <ReactABI31_0_0/ABI31_0_0RCTEventDispatcher.h>
#import <ReactABI31_0_0/ABI31_0_0RCTEventEmitter.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManagerObserverCoordinator.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManagerUtils.h>

#import "ABI31_0_0REAValueNode.h"

@interface ABI31_0_0REAModule : ABI31_0_0RCTEventEmitter <ABI31_0_0RCTBridgeModule, ABI31_0_0RCTEventDispatcherObserver, ABI31_0_0RCTUIManagerObserver>

@end
