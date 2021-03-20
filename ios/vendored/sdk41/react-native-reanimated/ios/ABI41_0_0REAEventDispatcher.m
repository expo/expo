#import "ABI41_0_0REAEventDispatcher.h"
#import <ABI41_0_0React/ABI41_0_0RCTDefines.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridge+Private.h>
#import <ABI41_0_0RNReanimated/ABI41_0_0REAModule.h>

@implementation ABI41_0_0REAEventDispatcher

- (void)sendEvent:(id<ABI41_0_0RCTEvent>)event
{
  [[ABI41_0_0_bridge_reanimated moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString*)moduleName
{
  return NSStringFromClass([ABI41_0_0RCTEventDispatcher class]);
}

@end
