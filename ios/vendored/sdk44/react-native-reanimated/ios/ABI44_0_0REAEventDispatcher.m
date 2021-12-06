#import "ABI44_0_0REAEventDispatcher.h"
#import <ABI44_0_0React/ABI44_0_0RCTDefines.h>
#import <ABI44_0_0React/ABI44_0_0RCTBridge+Private.h>
#import <ABI44_0_0RNReanimated/ABI44_0_0REAModule.h>

@implementation ABI44_0_0REAEventDispatcher

- (void)sendEvent:(id<ABI44_0_0RCTEvent>)event
{
  [[ABI44_0_0_bridge_reanimated moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString*)moduleName
{
  return NSStringFromClass([ABI44_0_0RCTEventDispatcher class]);
}

@end
