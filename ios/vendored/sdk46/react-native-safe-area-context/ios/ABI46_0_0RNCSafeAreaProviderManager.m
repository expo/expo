#import "ABI46_0_0RNCSafeAreaProviderManager.h"

#import "ABI46_0_0RNCSafeAreaProvider.h"

@implementation ABI46_0_0RNCSafeAreaProviderManager

ABI46_0_0RCT_EXPORT_MODULE(ABI46_0_0RNCSafeAreaProvider)

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, ABI46_0_0RCTDirectEventBlock)

- (UIView *)view
{
  return [ABI46_0_0RNCSafeAreaProvider new];
}

@end
