
#import "ABI10_0_0EXUtil.h"
#import "ABI10_0_0RCTUIManager.h"
#import "ABI10_0_0RCTBridge.h"


@implementation ABI10_0_0EXUtil

+ (NSString *)moduleName { return @"ExponentUtil"; }

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return self.bridge.uiManager.methodQueue;
}

ABI10_0_0RCT_EXPORT_METHOD(reload)
{
  [_bridge reload];
}


@end
