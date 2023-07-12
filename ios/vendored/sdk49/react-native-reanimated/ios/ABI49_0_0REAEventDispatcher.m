#import <ABI49_0_0RNReanimated/ABI49_0_0REAEventDispatcher.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>

@implementation ABI49_0_0REAEventDispatcher

- (void)sendEvent:(id<ABI49_0_0RCTEvent>)event
{
  [[[self bridge] moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString *)moduleName
{
  return NSStringFromClass([ABI49_0_0RCTEventDispatcher class]);
}

@end
