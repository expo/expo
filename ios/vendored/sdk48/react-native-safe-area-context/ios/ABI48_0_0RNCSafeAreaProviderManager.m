#import "ABI48_0_0RNCSafeAreaProviderManager.h"

#import "ABI48_0_0RNCSafeAreaProvider.h"

@implementation ABI48_0_0RNCSafeAreaProviderManager

ABI48_0_0RCT_EXPORT_MODULE(ABI48_0_0RNCSafeAreaProvider)

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, ABI48_0_0RCTDirectEventBlock)

- (UIView *)view
{
  return [ABI48_0_0RNCSafeAreaProvider new];
}

@end
