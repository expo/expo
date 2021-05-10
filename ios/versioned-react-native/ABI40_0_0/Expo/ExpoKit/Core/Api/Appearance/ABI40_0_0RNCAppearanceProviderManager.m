
#import "ABI40_0_0RNCAppearanceProviderManager.h"
#import "ABI40_0_0RNCAppearanceProvider.h"

@implementation ABI40_0_0RNCAppearanceProviderManager

ABI40_0_0RCT_EXPORT_MODULE(ABI40_0_0RNCAppearanceProvider)

- (UIView *)view
{
  return [[ABI40_0_0RNCAppearanceProvider alloc] initWithBridge:self.bridge];
}

@end
