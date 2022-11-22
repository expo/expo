#import <ABI47_0_0RNReanimated/ABI47_0_0REAEventDispatcher.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge+Private.h>
#import <ABI47_0_0React/ABI47_0_0RCTDefines.h>

@implementation ABI47_0_0REAEventDispatcher

- (void)sendEvent:(id<ABI47_0_0RCTEvent>)event
{
  [[[self bridge] moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString *)moduleName
{
  return NSStringFromClass([ABI47_0_0RCTEventDispatcher class]);
}

@end
