#import "REAEventDispatcher.h"
#import <React/RCTDefines.h>
#import <React/RCTBridge+Private.h>
#import <RNReanimated/REAModule.h>

@implementation REAEventDispatcher

- (void)sendEvent:(id<RCTEvent>)event
{
  [[_bridge_reanimated moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString*)moduleName
{
  return NSStringFromClass([RCTEventDispatcher class]);
}

@end
