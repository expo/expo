#import "ABI7_0_0EXLinearGradientManager.h"
#import "ABI7_0_0EXLinearGradient.h"
#import "ABI7_0_0RCTBridge.h"

@implementation ABI7_0_0EXLinearGradientManager

ABI7_0_0RCT_EXPORT_MODULE(ExponentLinearGradientManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI7_0_0EXLinearGradient alloc] init];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(colors, NSArray);
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(start, CGPoint);
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(end, CGPoint);
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(locations, NSArray);

@end
