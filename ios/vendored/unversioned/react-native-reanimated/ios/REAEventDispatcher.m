#import <RNReanimated/REAEventDispatcher.h>
#import <RNReanimated/REAModule.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTDefines.h>

@implementation REAEventDispatcher

- (void)sendEvent:(id<RCTEvent>)event
{
  [[[self bridge] moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString *)moduleName
{
  return NSStringFromClass([RCTEventDispatcher class]);
}

@end
