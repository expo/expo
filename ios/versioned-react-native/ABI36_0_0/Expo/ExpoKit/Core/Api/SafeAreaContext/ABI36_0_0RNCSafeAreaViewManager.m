#import "ABI36_0_0RNCSafeAreaViewManager.h"

#import "ABI36_0_0RNCSafeAreaView.h"

@implementation ABI36_0_0RNCSafeAreaViewManager

ABI36_0_0RCT_EXPORT_MODULE(ABI36_0_0RNCSafeAreaView)

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, ABI36_0_0RCTBubblingEventBlock)

- (UIView *)view
{
  return [ABI36_0_0RNCSafeAreaView new];
}

@end
