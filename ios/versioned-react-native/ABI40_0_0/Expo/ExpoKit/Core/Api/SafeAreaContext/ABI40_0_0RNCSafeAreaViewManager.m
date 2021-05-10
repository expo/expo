#import "ABI40_0_0RNCSafeAreaViewManager.h"

#import "ABI40_0_0RNCSafeAreaShadowView.h"
#import "ABI40_0_0RNCSafeAreaView.h"
#import "ABI40_0_0RNCSafeAreaViewMode.h"
#import "ABI40_0_0RNCSafeAreaViewEdges.h"

@implementation ABI40_0_0RNCSafeAreaViewManager

ABI40_0_0RCT_EXPORT_MODULE(ABI40_0_0RNCSafeAreaView)

- (UIView *)view
{
  return [[ABI40_0_0RNCSafeAreaView alloc] initWithBridge:self.bridge];
}

- (ABI40_0_0RNCSafeAreaShadowView *)shadowView
{
  return [ABI40_0_0RNCSafeAreaShadowView new];
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(mode, ABI40_0_0RNCSafeAreaViewMode)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(edges, ABI40_0_0RNCSafeAreaViewEdges)

@end
