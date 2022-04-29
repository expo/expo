#import "ABI45_0_0RNCSafeAreaProviderManager.h"

#import "ABI45_0_0RNCSafeAreaProvider.h"

@implementation ABI45_0_0RNCSafeAreaProviderManager

ABI45_0_0RCT_EXPORT_MODULE(ABI45_0_0RNCSafeAreaProvider)

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, ABI45_0_0RCTDirectEventBlock)

- (UIView *)view
{
  return [ABI45_0_0RNCSafeAreaProvider new];
}

@end
