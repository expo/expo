
#import "ABI42_0_0RNCAppearanceProviderManager.h"
#import "ABI42_0_0RNCAppearanceProvider.h"

@implementation ABI42_0_0RNCAppearanceProviderManager

ABI42_0_0RCT_EXPORT_MODULE(ABI42_0_0RNCAppearanceProvider)

- (UIView *)view
{
  return [[ABI42_0_0RNCAppearanceProvider alloc] initWithBridge:self.bridge];
}

@end
