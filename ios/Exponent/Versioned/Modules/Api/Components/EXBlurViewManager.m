#import "EXBlurViewManager.h"
#import "EXBlurView.h"

@implementation EXBlurViewManager

RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[EXBlurView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(tintEffect, NSString);

@end