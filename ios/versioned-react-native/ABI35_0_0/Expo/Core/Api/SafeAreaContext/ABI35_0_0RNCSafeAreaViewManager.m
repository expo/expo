#import "ABI35_0_0RNCSafeAreaViewManager.h"

#import "ABI35_0_0RNCSafeAreaView.h"

@implementation ABI35_0_0RNCSafeAreaViewManager

ABI35_0_0RCT_EXPORT_MODULE(ABI35_0_0RNCSafeAreaView)

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, ABI35_0_0RCTBubblingEventBlock)

- (UIView *)view
{
  return [ABI35_0_0RNCSafeAreaView new];
}

@end
