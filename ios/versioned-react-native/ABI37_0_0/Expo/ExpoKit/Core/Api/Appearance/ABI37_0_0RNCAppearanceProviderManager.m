
#import "ABI37_0_0RNCAppearanceProviderManager.h"
#import "ABI37_0_0RNCAppearanceProvider.h"

@implementation ABI37_0_0RNCAppearanceProviderManager

ABI37_0_0RCT_EXPORT_MODULE(ABI37_0_0RNCAppearanceProvider)

- (UIView *)view
{
  return [[ABI37_0_0RNCAppearanceProvider alloc] initWithBridge:self.bridge];
}

@end
