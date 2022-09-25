#import "DevMenuREAEventDispatcher.h"
#import "DevMenuREAModule.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTDefines.h>

@implementation DevMenuREAEventDispatcher

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
