
#import "ABI35_0_0RNCAppearanceProviderManager.h"
#import "ABI35_0_0RNCAppearanceProvider.h"

@implementation ABI35_0_0RNCAppearanceProviderManager

ABI35_0_0RCT_EXPORT_MODULE(ABI35_0_0RNCAppearanceProvider)

- (UIView *)view
{
  return [ABI35_0_0RNCAppearanceProvider new];
}

@end
