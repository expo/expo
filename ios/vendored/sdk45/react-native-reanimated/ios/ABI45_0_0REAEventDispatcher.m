#import <ABI45_0_0RNReanimated/ABI45_0_0REAEventDispatcher.h>
#import <ABI45_0_0RNReanimated/ABI45_0_0REAModule.h>
#import <ABI45_0_0React/ABI45_0_0RCTBridge+Private.h>
#import <ABI45_0_0React/ABI45_0_0RCTDefines.h>

@implementation ABI45_0_0REAEventDispatcher

- (void)sendEvent:(id<ABI45_0_0RCTEvent>)event
{
  [[[self bridge] moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString *)moduleName
{
  return NSStringFromClass([ABI45_0_0RCTEventDispatcher class]);
}

@end
