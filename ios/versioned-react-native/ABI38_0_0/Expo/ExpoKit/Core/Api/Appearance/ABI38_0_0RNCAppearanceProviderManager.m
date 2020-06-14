
#import "ABI38_0_0RNCAppearanceProviderManager.h"
#import "ABI38_0_0RNCAppearanceProvider.h"

@implementation ABI38_0_0RNCAppearanceProviderManager

ABI38_0_0RCT_EXPORT_MODULE(ABI38_0_0RNCAppearanceProvider)

- (UIView *)view
{
  return [[ABI38_0_0RNCAppearanceProvider alloc] initWithBridge:self.bridge];
}

@end
