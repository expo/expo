#import "ABI47_0_0RNCSafeAreaProviderManager.h"

#import "ABI47_0_0RNCSafeAreaProvider.h"

@implementation ABI47_0_0RNCSafeAreaProviderManager

ABI47_0_0RCT_EXPORT_MODULE(ABI47_0_0RNCSafeAreaProvider)

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, ABI47_0_0RCTDirectEventBlock)

- (UIView *)view
{
  return [ABI47_0_0RNCSafeAreaProvider new];
}

@end
