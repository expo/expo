#import "ABI40_0_0REAEventDispatcher.h"
#import <ABI40_0_0React/ABI40_0_0RCTDefines.h>
#import <ABI40_0_0React/ABI40_0_0RCTBridge+Private.h>
#import "ABI40_0_0REAModule.h"

@implementation ABI40_0_0REAEventDispatcher

- (void)sendEvent:(id<ABI40_0_0RCTEvent>)event
{
  [[ABI40_0_0_bridge_reanimated moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString*)moduleName
{
  return NSStringFromClass([ABI40_0_0RCTEventDispatcher class]);
}

@end
