#import "DevMenuREAEventDispatcher.h"
#import <React/RCTDefines.h>
#import <React/RCTBridge+Private.h>
#import "DevMenuREAModule.h"

@implementation DevMenuREAEventDispatcher

- (void)sendEvent:(id<RCTEvent>)event
{
  [[_devmenu_bridge_reanimated moduleForName:@"ReanimatedModule"] eventDispatcherWillDispatchEvent:event];
  [super sendEvent:event];
}

+ (NSString*)moduleName
{
  return NSStringFromClass([RCTEventDispatcher class]);
}

@end
