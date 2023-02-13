#import <ABI48_0_0RNReanimated/ABI48_0_0REAEventDispatcher.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REAModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridge+Private.h>
#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>

@implementation ABI48_0_0REAEventDispatcher

- (void)sendEvent:(id<ABI48_0_0RCTEvent>)event
{
  [[[self bridge] moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString *)moduleName
{
  return NSStringFromClass([ABI48_0_0RCTEventDispatcher class]);
}

@end
