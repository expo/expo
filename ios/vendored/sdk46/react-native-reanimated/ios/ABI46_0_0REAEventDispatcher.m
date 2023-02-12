#import <ABI46_0_0RNReanimated/ABI46_0_0REAEventDispatcher.h>
#import <ABI46_0_0RNReanimated/ABI46_0_0REAModule.h>
#import <ABI46_0_0React/ABI46_0_0RCTBridge+Private.h>
#import <ABI46_0_0React/ABI46_0_0RCTDefines.h>

@implementation ABI46_0_0REAEventDispatcher

- (void)sendEvent:(id<ABI46_0_0RCTEvent>)event
{
  [[[self bridge] moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString *)moduleName
{
  return NSStringFromClass([ABI46_0_0RCTEventDispatcher class]);
}

@end
