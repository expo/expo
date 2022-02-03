
#import "ABI43_0_0RNCAppearanceProviderManager.h"
#import "ABI43_0_0RNCAppearanceProvider.h"

@implementation ABI43_0_0RNCAppearanceProviderManager

ABI43_0_0RCT_EXPORT_MODULE(ABI43_0_0RNCAppearanceProvider)

- (UIView *)view
{
  return [[ABI43_0_0RNCAppearanceProvider alloc] initWithBridge:self.bridge];
}

@end
