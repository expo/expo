#import "ABI49_0_0RNCSafeAreaProviderManager.h"

#import "ABI49_0_0RNCSafeAreaProvider.h"

@implementation ABI49_0_0RNCSafeAreaProviderManager

ABI49_0_0RCT_EXPORT_MODULE(ABI49_0_0RNCSafeAreaProvider)

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, ABI49_0_0RCTDirectEventBlock)

- (UIView *)view
{
  return [ABI49_0_0RNCSafeAreaProvider new];
}

@end
