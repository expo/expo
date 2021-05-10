
#import "ABI41_0_0RNCAppearanceProviderManager.h"
#import "ABI41_0_0RNCAppearanceProvider.h"

@implementation ABI41_0_0RNCAppearanceProviderManager

ABI41_0_0RCT_EXPORT_MODULE(ABI41_0_0RNCAppearanceProvider)

- (UIView *)view
{
  return [[ABI41_0_0RNCAppearanceProvider alloc] initWithBridge:self.bridge];
}

@end
