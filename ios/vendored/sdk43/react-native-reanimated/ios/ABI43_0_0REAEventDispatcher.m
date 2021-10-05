#import "ABI43_0_0REAEventDispatcher.h"
#import <ABI43_0_0React/ABI43_0_0RCTDefines.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridge+Private.h>
#import <ABI43_0_0RNReanimated/ABI43_0_0REAModule.h>

@implementation ABI43_0_0REAEventDispatcher

- (void)sendEvent:(id<ABI43_0_0RCTEvent>)event
{
  [[ABI43_0_0_bridge_reanimated moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString*)moduleName
{
  return NSStringFromClass([ABI43_0_0RCTEventDispatcher class]);
}

@end
