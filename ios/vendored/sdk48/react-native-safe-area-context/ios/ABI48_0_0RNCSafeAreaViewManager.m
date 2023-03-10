#import "ABI48_0_0RNCSafeAreaViewManager.h"

#import "ABI48_0_0RNCSafeAreaShadowView.h"
#import "ABI48_0_0RNCSafeAreaView.h"
#import "ABI48_0_0RNCSafeAreaViewEdges.h"
#import "ABI48_0_0RNCSafeAreaViewMode.h"

@implementation ABI48_0_0RNCSafeAreaViewManager

ABI48_0_0RCT_EXPORT_MODULE(ABI48_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI48_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI48_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI48_0_0RNCSafeAreaShadowView new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI48_0_0RNCSafeAreaViewMode)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI48_0_0RNCSafeAreaViewEdges)

@end
