#import "ABI8_0_0EXBlurViewManager.h"
#import "ABI8_0_0EXBlurView.h"

@implementation ABI8_0_0EXBlurViewManager

ABI8_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI8_0_0EXBlurView alloc] init];
}

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(tintEffect, NSString);

@end
