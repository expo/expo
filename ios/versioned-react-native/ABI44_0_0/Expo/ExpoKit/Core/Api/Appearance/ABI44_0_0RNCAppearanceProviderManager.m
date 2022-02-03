
#import "ABI44_0_0RNCAppearanceProviderManager.h"
#import "ABI44_0_0RNCAppearanceProvider.h"

@implementation ABI44_0_0RNCAppearanceProviderManager

ABI44_0_0RCT_EXPORT_MODULE(ABI44_0_0RNCAppearanceProvider)

- (UIView *)view
{
  return [[ABI44_0_0RNCAppearanceProvider alloc] initWithBridge:self.bridge];
}

@end
