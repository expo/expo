#import "ABI45_0_0RNCSafeAreaViewManager.h"

#import "ABI45_0_0RNCSafeAreaShadowView.h"
#import "ABI45_0_0RNCSafeAreaView.h"
#import "ABI45_0_0RNCSafeAreaViewEdges.h"
#import "ABI45_0_0RNCSafeAreaViewMode.h"

@implementation ABI45_0_0RNCSafeAreaViewManager

ABI45_0_0RCT_EXPORT_MODULE(ABI45_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI45_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI45_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI45_0_0RNCSafeAreaShadowView new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI45_0_0RNCSafeAreaViewMode)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI45_0_0RNCSafeAreaViewEdges)

@end
