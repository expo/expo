#import "EXAdIconViewManager.h"

@implementation EXAdIconViewManager

RCT_EXPORT_MODULE(AdIconViewManager)

- (UIView *)view
{
  return [[FBAdIconView alloc] init];
}

@end
