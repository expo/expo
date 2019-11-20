
#import "ABI36_0_0RNCAppearanceProviderManager.h"
#import "ABI36_0_0RNCAppearanceProvider.h"

@implementation ABI36_0_0RNCAppearanceProviderManager

ABI36_0_0RCT_EXPORT_MODULE(ABI36_0_0RNCAppearanceProvider)

- (UIView *)view
{
  return [ABI36_0_0RNCAppearanceProvider new];
}

@end
