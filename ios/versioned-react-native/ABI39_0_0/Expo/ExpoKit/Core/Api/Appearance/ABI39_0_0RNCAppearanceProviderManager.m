
#import "ABI39_0_0RNCAppearanceProviderManager.h"
#import "ABI39_0_0RNCAppearanceProvider.h"

@implementation ABI39_0_0RNCAppearanceProviderManager

ABI39_0_0RCT_EXPORT_MODULE(ABI39_0_0RNCAppearanceProvider)

- (UIView *)view
{
  return [[ABI39_0_0RNCAppearanceProvider alloc] initWithBridge:self.bridge];
}

@end
