#import "RNCSafeAreaProviderManager.h"

#import "RNCSafeAreaProvider.h"

@implementation RNCSafeAreaProviderManager

RCT_EXPORT_MODULE(RNCSafeAreaProvider)

RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, RCTDirectEventBlock)

- (UIView *)view
{
  return [RNCSafeAreaProvider new];
}

@end
