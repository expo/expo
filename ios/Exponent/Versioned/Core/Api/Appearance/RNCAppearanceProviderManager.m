
#import "RNCAppearanceProviderManager.h"
#import "RNCAppearanceProvider.h"

@implementation RNCAppearanceProviderManager

RCT_EXPORT_MODULE(RNCAppearanceProvider)

- (UIView *)view
{
  return [RNCAppearanceProvider new];
}

@end
