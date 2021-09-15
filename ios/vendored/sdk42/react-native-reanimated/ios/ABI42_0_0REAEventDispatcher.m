#import "ABI42_0_0REAEventDispatcher.h"
#import <ABI42_0_0React/ABI42_0_0RCTDefines.h>
#import <ABI42_0_0React/ABI42_0_0RCTBridge+Private.h>
#import <ABI42_0_0RNReanimated/ABI42_0_0REAModule.h>

@implementation ABI42_0_0REAEventDispatcher

- (void)sendEvent:(id<ABI42_0_0RCTEvent>)event
{
  [[ABI42_0_0_bridge_reanimated moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString*)moduleName
{
  return NSStringFromClass([ABI42_0_0RCTEventDispatcher class]);
}

@end
