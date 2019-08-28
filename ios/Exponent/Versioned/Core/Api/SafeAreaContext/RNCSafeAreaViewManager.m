#import "RNCSafeAreaViewManager.h"

#import "RNCSafeAreaView.h"

@implementation RNCSafeAreaViewManager

RCT_EXPORT_MODULE(RNCSafeAreaView)

RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, RCTBubblingEventBlock)

- (UIView *)view
{
  return [RNCSafeAreaView new];
}

@end
